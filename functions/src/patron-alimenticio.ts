import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import OpenAI from "openai";
import { openaiApiKey } from "./secrets";
import {
  AnalizarPatronRequest,
  AnalizarPatronResponse,
  ConsumoParaAnalisis,
  PerfilNutricional,
} from "./types";
import { extraerCalificacion } from "./utils";

function construirPromptPatron(
  consumos: ConsumoParaAnalisis[],
  rangoFechas: string,
  perfil?: PerfilNutricional
): string {
  let prompt = `Analiza el patrón alimenticio de este período: ${rangoFechas}\n\n`;
  prompt += `**Registros de comida (${consumos.length} en total):**\n`;
  consumos.forEach((c, i) => {
    const fecha = c.fechaCreacion.slice(0, 10);
    const hora = c.fechaCreacion.slice(11, 16);
    const kcal = c.energia ? `${c.energia} kcal` : "sin dato kcal";
    const carbs = c.carb ? `C:${c.carb}g` : "";
    const prot = c.proteina ? `P:${c.proteina}g` : "";
    const grasas = c.grasa ? `G:${c.grasa}g` : "";
    const macros = [carbs, prot, grasas].filter(Boolean).join(" ");
    const cal = c.calificacion ? ` [${c.calificacion}]` : "";
    prompt += `${i + 1}. ${fecha} ${hora} | ${c.tipoComida || "Comida"} | ${c.nombre || "Sin nombre"} | ${kcal}${macros ? ` | ${macros}` : ""}${cal}\n`;
  });

  if (perfil) {
    prompt += `\n**Perfil del usuario:**\n`;
    if (perfil.edad) prompt += `- Edad: ${perfil.edad} años\n`;
    if (perfil.sexo) prompt += `- Sexo: ${perfil.sexo}\n`;
    if (perfil.altura) prompt += `- Altura: ${perfil.altura} cm\n`;
    if (perfil.peso) prompt += `- Peso: ${perfil.peso} kg\n`;
    if (perfil.ejercicio) prompt += `- Actividad: ${perfil.ejercicio}\n`;
    if (perfil.objetivos) {
      const obj = Array.isArray(perfil.objetivos) ? perfil.objetivos.join(", ") : perfil.objetivos;
      prompt += `- Objetivos: ${obj}\n`;
    }
    if (perfil.preferenciaNutricional) prompt += `- Preferencia: ${perfil.preferenciaNutricional}\n`;
    if (perfil.restricciones?.length) prompt += `- Restricciones: ${perfil.restricciones.join(", ")}\n`;
  }

  if (perfil?.preferenciaNutricional || perfil?.restricciones?.length) {
    prompt += `\n**IMPORTANTE — Respetar siempre el perfil del usuario:**\n`;
    if (perfil.preferenciaNutricional) {
      prompt += `- El usuario sigue una dieta "${perfil.preferenciaNutricional}". Todos los puntos fuertes, débiles y recomendaciones DEBEN ser coherentes con esta preferencia. Nunca marcar como punto fuerte un alimento incompatible, ni recomendar alimentos que la contradigan.\n`;
    }
    if (perfil.restricciones?.length) {
      prompt += `- Restricciones estrictas: ${perfil.restricciones.join(", ")}. No mencionar ni sugerir ninguno de estos alimentos en ninguna sección.\n`;
    }
  }

  prompt += `
Respondé ÚNICAMENTE con el siguiente JSON (sin texto antes ni después):
{
  "analisis": "Análisis narrativo del patrón alimenticio, máximo 250 palabras, en español. Incluye observaciones sobre distribución de comidas, balance de macronutrientes, consistencia y tendencias.",
  "resumen": {
    "puntosFuertes": ["punto 1", "punto 2"],
    "puntosDébiles": ["punto 1", "punto 2"],
    "recomendaciones": ["recomendación 1", "recomendación 2", "recomendación 3"]
  },
  "calificacionGeneral": "[MUY_SALUDABLE|EQUILIBRADA|POCO_NUTRITIVA]"
}

Reglas:
- "analisis": texto corrido, sin listas, máximo 250 palabras
- Cada lista de resumen: entre 2 y 4 ítems concisos
- "calificacionGeneral": SOLO uno de esos tres valores exactos entre corchetes
- Respetar estrictamente la preferencia nutricional y restricciones del perfil en TODAS las secciones
`;
  return prompt;
}

/**
 * Analiza el patrón alimenticio de un usuario en un rango de fechas usando OpenAI
 */
export const analizarPatronAlimenticio = onCall<AnalizarPatronRequest>(
  { secrets: [openaiApiKey], cors: true },
  async (request) => {
    try {
      const { consumos, rangoFechas, perfilNutricional } = request.data;

      if (!consumos || consumos.length === 0) {
        throw new HttpsError("invalid-argument", "Se requieren consumos para analizar");
      }

      const openai = new OpenAI({ apiKey: openaiApiKey.value() });

      const prompt = construirPromptPatron(
        consumos.slice(0, 100),
        rangoFechas,
        perfilNutricional
      );

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Eres un nutricionista experto que analiza patrones alimenticios de forma holística. " +
              "Respondé ÚNICAMENTE con un JSON válido. Sin texto antes ni después. " +
              "Respondé siempre en español.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 900,
      });

      const contenido = completion.choices[0]?.message?.content || "";
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new HttpsError("internal", "Respuesta inválida de OpenAI");

      const raw = JSON.parse(jsonMatch[0]);

      const calificacionGeneral = extraerCalificacion(raw.calificacionGeneral ?? "");

      const response: AnalizarPatronResponse = {
        analisis: String(raw.analisis || ""),
        resumen: {
          puntosFuertes: Array.isArray(raw.resumen?.puntosFuertes) ? raw.resumen.puntosFuertes : [],
          puntosDébiles: Array.isArray(raw.resumen?.puntosDébiles) ? raw.resumen.puntosDébiles : [],
          recomendaciones: Array.isArray(raw.resumen?.recomendaciones) ? raw.resumen.recomendaciones : [],
        },
        calificacionGeneral,
      };

      logger.info("Análisis de patrón completado", { count: consumos.length, calificacionGeneral });
      return response;
    } catch (error: any) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error al analizar patrón alimenticio", error);
      throw new HttpsError("internal", `Error al analizar el patrón: ${error.message || "Error desconocido"}`);
    }
  }
);

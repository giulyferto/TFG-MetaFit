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
import { calificacionDesdePuntuacion } from "./utils";

function sumarCampo(
  consumos: ConsumoParaAnalisis[],
  campo: "energia" | "carb" | "proteina" | "fibra" | "grasa"
): number {
  return consumos.reduce((acc, c) => acc + (parseFloat(c[campo] || "0") || 0), 0);
}

function construirPromptPatron(
  consumos: ConsumoParaAnalisis[],
  rangoFechas: string,
  perfil?: PerfilNutricional
): string {
  let prompt = `Analiza el patrón alimenticio de este período: ${rangoFechas}\n\n`;

  const porDia = new Map<string, ConsumoParaAnalisis[]>();
  for (const c of consumos) {
    const fecha = c.fechaCreacion.slice(0, 10);
    if (!porDia.has(fecha)) porDia.set(fecha, []);
    porDia.get(fecha)!.push(c);
  }

  prompt += `**Consumo agrupado por día (${consumos.length} registros en total, en ${porDia.size} días dentro del período):**\n`;
  for (const [fecha, delDia] of porDia) {
    const kcalDia = Math.round(sumarCampo(delDia, "energia"));
    const carbDia = Math.round(sumarCampo(delDia, "carb"));
    const protDia = Math.round(sumarCampo(delDia, "proteina"));
    const grasaDia = Math.round(sumarCampo(delDia, "grasa"));
    prompt += `\n${fecha} — Total del día: ${kcalDia} kcal | C:${carbDia}g P:${protDia}g G:${grasaDia}g\n`;
    delDia.forEach((c) => {
      const kcal = c.energia ? `${c.energia} kcal` : "sin dato kcal";
      const carbs = c.carb ? `C:${c.carb}g` : "";
      const prot = c.proteina ? `P:${c.proteina}g` : "";
      const grasas = c.grasa ? `G:${c.grasa}g` : "";
      const macros = [carbs, prot, grasas].filter(Boolean).join(" ");
      const cal = c.calificacion ? ` [${c.calificacion}]` : "";
      prompt += `  - ${c.tipoComida || "Comida"}: ${c.nombre || "Sin nombre"} | ${kcal}${macros ? ` | ${macros}` : ""}${cal}\n`;
    });
  }

  const kcalTotal = Math.round(sumarCampo(consumos, "energia"));
  const carbTotal = Math.round(sumarCampo(consumos, "carb"));
  const protTotal = Math.round(sumarCampo(consumos, "proteina"));
  const grasaTotal = Math.round(sumarCampo(consumos, "grasa"));
  const kcalPromedioDia = porDia.size > 0 ? Math.round(kcalTotal / porDia.size) : 0;
  prompt += `\n**Totales de todo el período:** ${kcalTotal} kcal | C:${carbTotal}g P:${protTotal}g G:${grasaTotal}g `;
  prompt += `(promedio de ${kcalPromedioDia} kcal/día en ${porDia.size} días)\n`;

  prompt += `\nIMPORTANTE: Basá el análisis en el consumo total de cada día y en la tendencia de todo el período — `;
  prompt += `NO te enfoques en horarios puntuales de cada comida, sino en qué y cuánto se comió en conjunto por `;
  prompt += `día, y cómo varía o se mantiene esa alimentación a lo largo del rango de fechas consultado.\n`;

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
  "analisis": "Análisis narrativo del patrón alimenticio, máximo 250 palabras, en español. Incluye observaciones sobre distribución de comidas, balance de macronutrientes, consistencia entre días y tendencias del período.",
  "resumen": {
    "puntosFuertes": ["punto 1", "punto 2"],
    "puntosDébiles": ["punto 1", "punto 2"],
    "recomendaciones": ["recomendación 1", "recomendación 2", "recomendación 3"]
  },
  "puntuacionGeneral": 0
}

Reglas:
- "analisis": texto corrido, sin listas, máximo 250 palabras
- Cada lista de resumen: entre 2 y 4 ítems concisos
- "puntuacionGeneral": entero de 0 a 100 (uso interno) que refleje la calidad del patrón alimenticio en TODO el `;
  prompt += `período (no de una comida aislada), considerando el conjunto de días, el objetivo del usuario y sus `;
  prompt += `restricciones. Guía de rangos (NO reserves el rango alto solo para un patrón perfecto):\n`;
  prompt += `  - 70-100: patrón mayoritariamente saludable y razonablemente consistente entre días, que favorece `;
  prompt += `o es neutral respecto al objetivo del usuario, sin violar ninguna restricción dietética en el período.\n`;
  prompt += `  - 41-69: patrón razonable pero con inconsistencias notables entre días (ej: días muy desbalanceados `;
  prompt += `frente a otros buenos), o que nutricionalmente es aceptable pero no colabora demasiado con el objetivo `;
  prompt += `sin llegar a contradecirlo.\n`;
  prompt += `  - 0-40: patrón con carencias nutricionales relevantes y sostenidas en varios días, o que contradice `;
  prompt += `claramente el objetivo declarado, o que viola alguna restricción dietética del usuario en uno o más `;
  prompt += `días (en ese caso SIEMPRE debe estar en este rango, sin importar el resto).
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

      const calificacionGeneral = calificacionDesdePuntuacion(`Puntuación: [${raw.puntuacionGeneral ?? ""}]`);

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

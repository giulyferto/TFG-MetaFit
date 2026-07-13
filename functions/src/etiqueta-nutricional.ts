import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import OpenAI from "openai";
import { openaiApiKey } from "./secrets";
import { LeerEtiquetaRaw, LeerEtiquetaRequest, LeerEtiquetaResponse } from "./types";

/**
 * Lee la tabla nutricional de la foto de un envase y devuelve los macros por 100g.
 */
export const leerEtiquetaNutricional = onCall<LeerEtiquetaRequest>(
  {
    secrets: [openaiApiKey],
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (request) => {
    try {
      const { imagenBase64 } = request.data;
      if (!imagenBase64) throw new HttpsError("invalid-argument", "Se requiere una imagen");

      const openai = new OpenAI({ apiKey: openaiApiKey.value() });

      logger.info("Leyendo tabla nutricional con OpenAI Vision");

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analizá la tabla de información nutricional de este envase de alimento.

PASO 1 — Identificá el encabezado de la tabla:
Determiná a qué cantidad corresponden los valores de la columna principal:
- Si dice "por 100g" o "per 100g" → los valores son por 100g
- Si dice "por porción", "per serving", "cantidad por porción", "por envase" → los valores son por porción
- IMPORTANTE: muchas etiquetas latinoamericanas tienen DOS líneas de porción:
  - "Porción: Xg" (la porción real del producto, ej: 50g) ← ESTA ES LA QUE IMPORTA
  - "Porción de ref.: Yg" o "Porción de referencia: Yg" (valor regulatorio, ej: 40g) ← IGNORAR COMPLETAMENTE
  Los valores de la tabla corresponden a la PORCIÓN REAL (Xg). La "porción de ref." no se usa para nada.

PASO 2 — Extraé los valores tal como aparecen en la columna principal (NO los conviertas):
- Energía en kcal (ignorá kJ)
- Carbohidratos totales (g)
- Proteínas (g)
- Grasas totales (g)
- Fibra alimentaria (g) — si no figura usá 0
- Nombre del producto (si está visible en la imagen)

Respondé ÚNICAMENTE con este JSON (sin texto adicional, sin explicaciones):
{
  "encontrado": true,
  "nombre": "nombre del producto o vacío si no se ve",
  "porcionGramos": 50,
  "refGramos": 50,
  "energia": 199,
  "carb": 31,
  "proteina": 3.3,
  "fibra": 0,
  "grasa": 6.9
}

Reglas para cada campo:
- "porcionGramos": la porción REAL en gramos — el número que aparece en "Porción: Xg", NUNCA el de "Porción de ref." ni "Porción de referencia"
- "refGramos": los gramos a los que corresponden los valores extraídos
  → si los valores son "por 100g": ponés 100
  → si los valores son "por porción": ponés el mismo valor que porcionGramos
- "energia", "carb", etc.: los valores TAL COMO APARECEN en la tabla

Si la imagen NO muestra una tabla nutricional o es ilegible, respondé SOLO con:
{"encontrado": false}`,
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imagenBase64}` },
              },
            ],
          },
        ],
        max_tokens: 300,
      });

      const contenido = response.choices[0]?.message?.content ?? "";
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new HttpsError("internal", "Respuesta inválida de OpenAI");

      const raw = JSON.parse(jsonMatch[0]) as LeerEtiquetaRaw;

      if (!raw.encontrado) {
        logger.info("No se encontró tabla nutricional en la imagen");
        return { encontrado: false };
      }

      const porcion = Number(raw.porcionGramos) || 100;
      const ref = Number(raw.refGramos) || porcion;
      // Factor de normalización: convierte los valores leídos a por-100g
      const factor = 100 / ref;

      const resultado: LeerEtiquetaResponse = {
        encontrado: true,
        nombre: (raw.nombre || "").trim() || undefined,
        cantidad: porcion,
        energiaPor100g: Math.round((Number(raw.energia) || 0) * factor),
        carbPor100g: Math.round((Number(raw.carb) || 0) * factor * 10) / 10,
        proteinaPor100g: Math.round((Number(raw.proteina) || 0) * factor * 10) / 10,
        fibraPor100g: Math.round((Number(raw.fibra) || 0) * factor * 10) / 10,
        grasaPor100g: Math.round((Number(raw.grasa) || 0) * factor * 10) / 10,
      };

      logger.info("Tabla nutricional leída", {
        nombre: resultado.nombre,
        porcion: porcion,
        ref: ref,
        factor,
        energiaPor100g: resultado.energiaPor100g,
      });

      return resultado;
    } catch (error: any) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error al leer tabla nutricional", { error: error.message });
      throw new HttpsError("internal", `Error al leer la tabla nutricional: ${error.message || "Error desconocido"}`);
    }
  }
);

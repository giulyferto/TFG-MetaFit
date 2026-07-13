import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import OpenAI from "openai";
import { openaiApiKey } from "./secrets";
import { ObtenerNutricionRequest, ObtenerNutricionResponse } from "./types";

/**
 * Obtiene los valores nutricionales por 100g de un ingrediente dado su nombre
 */
export const obtenerNutricionIngrediente = onCall<ObtenerNutricionRequest>(
  {
    secrets: [openaiApiKey],
    cors: true,
  },
  async (request) => {
    try {
      const { nombre } = request.data;
      if (!nombre) throw new Error("Nombre del ingrediente requerido");

      const openai = new OpenAI({ apiKey: openaiApiKey.value() });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Eres un experto nutricionista. Proporciona los valores nutricionales estándar por 100 gramos para: "${nombre}".

Responde ÚNICAMENTE con este JSON (sin texto adicional):
{
  "energiaPor100g": número en kcal,
  "carbPor100g": número en gramos,
  "proteinaPor100g": número en gramos,
  "fibraPor100g": número en gramos,
  "grasaPor100g": número en gramos
}

Todos los valores son NÚMEROS. Si no conoces el alimento, usa estimaciones razonables. Si no puedes estimar un valor, usa 0.`,
          },
        ],
        max_tokens: 150,
      });

      const contenido = response.choices[0]?.message?.content;
      if (!contenido) throw new Error("Sin respuesta de OpenAI");

      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No se encontró JSON en la respuesta");

      const datos = JSON.parse(jsonMatch[0]);

      const result: ObtenerNutricionResponse = {
        energiaPor100g: Number(datos.energiaPor100g) || 0,
        carbPor100g: Number(datos.carbPor100g) || 0,
        proteinaPor100g: Number(datos.proteinaPor100g) || 0,
        fibraPor100g: Number(datos.fibraPor100g) || 0,
        grasaPor100g: Number(datos.grasaPor100g) || 0,
      };

      logger.info("Nutrición por 100g obtenida", { nombre, result });
      return result;
    } catch (error: any) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error al obtener nutrición del ingrediente", error);
      throw new HttpsError("internal", `Error al obtener valores nutricionales: ${error.message || "Error desconocido"}`);
    }
  }
);

import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import OpenAI from "openai";
import { openaiApiKey } from "./secrets";
import { AnalizarCodigoBarrasRequest, AnalizarCodigoBarrasResponse } from "./types";

/**
 * Analiza una imagen para reconocer un código de barras y extraer información del producto nutricional
 */
export const analizarCodigoBarras = onCall<AnalizarCodigoBarrasRequest>(
  {
    secrets: [openaiApiKey],
    cors: true,
    memory: "512MiB",
  },
  async (request) => {
    try {
      const { imagenBase64 } = request.data;
      if (!imagenBase64) throw new HttpsError("invalid-argument", "Se requiere una imagen");

      const openai = new OpenAI({ apiKey: openaiApiKey.value() });

      logger.info("Leyendo dígitos del código de barras con OpenAI Vision");

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Tu única tarea es leer los dígitos numéricos impresos debajo del código de barras en esta imagen.

Los códigos EAN-13 tienen 13 dígitos. Los UPC-A tienen 12 dígitos.
Enfocate en los NÚMEROS IMPRESOS debajo de las barras, no en las barras en sí.
Podés usar el texto visible en el envase como pista adicional para confirmar el producto.

Si los dígitos son legibles, responde SOLO con este JSON:
{ "encontrado": true, "ean": "1234567890123" }

Si los dígitos NO son legibles o no hay código de barras visible, responde SOLO con:
{ "encontrado": false }

SOLO el JSON, sin texto adicional.`,
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imagenBase64}` },
              },
            ],
          },
        ],
        max_tokens: 60,
      });

      const contenido = response.choices[0]?.message?.content ?? "";
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new HttpsError("internal", "Respuesta inválida de OpenAI");

      const resultado: AnalizarCodigoBarrasResponse = JSON.parse(jsonMatch[0]);

      logger.info("Lectura EAN completada", { encontrado: resultado.encontrado, ean: resultado.ean ?? "—" });

      return resultado;
    } catch (error: any) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error al leer código de barras", { error: error.message });
      throw new HttpsError("internal", `Error al leer el código de barras: ${error.message || "Error desconocido"}`);
    }
  }
);

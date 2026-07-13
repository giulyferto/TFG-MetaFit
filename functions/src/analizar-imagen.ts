import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import OpenAI from "openai";
import { openaiApiKey } from "./secrets";
import { AnalizarImagenRequest, AnalizarImagenResponse, DatosComida, IngredienteIA } from "./types";

/**
 * Analiza una imagen para determinar si es un plato de comida y extraer datos nutricionales
 */
export const analizarImagenComida = onCall<AnalizarImagenRequest>(
  {
    secrets: [openaiApiKey],
    cors: true,
  },
  async (request) => {
    try {
      const { imagenBase64 } = request.data;

      if (!imagenBase64) {
        throw new Error("No se proporcionó una imagen");
      }

      // Inicializar OpenAI
      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      });

      logger.info("Analizando imagen con OpenAI Vision");

      // Llamar a OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Eres un experto nutricionista. Analiza esta imagen y determina si es un plato de comida.

INSTRUCCIONES:
1. Si la imagen NO muestra un plato de comida (por ejemplo, es un objeto, un animal, un paisaje, etc.), responde EXACTAMENTE con este JSON:
{"esPlatoComida": false, "mensaje": "La imagen no parece ser un plato de comida"}

2. Si la imagen SÍ muestra un plato de comida, identifica CADA ingrediente visible por separado. Para cada ingrediente proporciona sus valores nutricionales estándar POR 100 GRAMOS y estima el peso (en gramos) de ese ingrediente en la porción visible. Responde EXACTAMENTE con este JSON:
{
  "esPlatoComida": true,
  "nombre": "nombre descriptivo del plato completo",
  "ingredientes": [
    {
      "nombre": "nombre del ingrediente",
      "pesoEstimado": 60,
      "energiaPor100g": 265,
      "carbPor100g": 49,
      "proteinaPor100g": 9,
      "fibraPor100g": 3,
      "grasaPor100g": 3
    }
  ]
}

IMPORTANTE:
- Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después
- Todos los valores numéricos son NÚMEROS (no strings)
- "pesoEstimado" es el peso en gramos del ingrediente en la porción del plato
- Los valores "Por100g" son los valores nutricionales estándar por cada 100g de ese ingrediente
- Identifica todos los ingredientes principales visibles de forma separada
- Si no puedes estimar un valor numérico, usa 0`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imagenBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
      });

      const contenido = response.choices[0]?.message?.content;
      if (!contenido) {
        throw new Error("No se recibió respuesta de OpenAI");
      }

      logger.info("Respuesta de OpenAI recibida", { contenido });

      // Parsear la respuesta JSON
      let resultado: AnalizarImagenResponse;
      try {
        // Limpiar el contenido para extraer solo el JSON
        const jsonMatch = contenido.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          resultado = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No se encontró JSON en la respuesta");
        }
      } catch (parseError) {
        logger.error("Error al parsear respuesta de OpenAI", parseError);
        throw new Error("Error al procesar la respuesta de la IA");
      }

      if (!resultado.esPlatoComida) {
        return {
          esPlatoComida: false,
          mensaje: resultado.mensaje || "La imagen no parece ser un plato de comida",
        };
      }

      // New ingredient-based response
      if (resultado.ingredientes && resultado.ingredientes.length > 0) {
        const ingredientes: IngredienteIA[] = resultado.ingredientes.map((ing: any) => ({
          nombre: ing.nombre || "Ingrediente",
          pesoEstimado: Number(ing.pesoEstimado) || 0,
          energiaPor100g: Number(ing.energiaPor100g) || 0,
          carbPor100g: Number(ing.carbPor100g) || 0,
          proteinaPor100g: Number(ing.proteinaPor100g) || 0,
          fibraPor100g: Number(ing.fibraPor100g) || 0,
          grasaPor100g: Number(ing.grasaPor100g) || 0,
        }));

        // Compute totals for backward-compat datosComida
        const totalPeso = ingredientes.reduce((s, i) => s + i.pesoEstimado, 0);
        const totalEnergia = ingredientes.reduce((s, i) => s + i.energiaPor100g * i.pesoEstimado / 100, 0);
        const totalCarb = ingredientes.reduce((s, i) => s + i.carbPor100g * i.pesoEstimado / 100, 0);
        const totalProteina = ingredientes.reduce((s, i) => s + i.proteinaPor100g * i.pesoEstimado / 100, 0);
        const totalFibra = ingredientes.reduce((s, i) => s + i.fibraPor100g * i.pesoEstimado / 100, 0);
        const totalGrasa = ingredientes.reduce((s, i) => s + i.grasaPor100g * i.pesoEstimado / 100, 0);

        logger.info("Imagen analizada con ingredientes", { nombre: resultado.nombre, count: ingredientes.length });

        return {
          esPlatoComida: true,
          nombre: resultado.nombre || "",
          ingredientes,
          datosComida: {
            nombre: resultado.nombre || "",
            cantidad: String(Math.round(totalPeso)),
            energia: String(Math.round(totalEnergia)),
            carb: String(Math.round(totalCarb)),
            proteina: String(Math.round(totalProteina)),
            fibra: String(Math.round(totalFibra)),
            grasa: String(Math.round(totalGrasa)),
          },
        };
      }

      // Fallback: old-style datosComida response
      if (!resultado.datosComida) {
        throw new Error("No se pudieron extraer los datos nutricionales");
      }

      const datosComida: DatosComida = {
        nombre: resultado.datosComida.nombre || "",
        cantidad: resultado.datosComida.cantidad || "0",
        energia: resultado.datosComida.energia || "0",
        carb: resultado.datosComida.carb || "0",
        proteina: resultado.datosComida.proteina || "0",
        fibra: resultado.datosComida.fibra || "0",
        grasa: resultado.datosComida.grasa || "0",
      };

      logger.info("Imagen analizada exitosamente", { esPlatoComida: true, nombre: datosComida.nombre });

      return { esPlatoComida: true, datosComida };
    } catch (error: any) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error al analizar imagen", error);
      throw new HttpsError("internal", `Error al analizar la imagen: ${error.message || "Error desconocido"}`);
    }
  }
);

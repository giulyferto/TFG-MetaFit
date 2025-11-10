/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { onCall } from "firebase-functions/v2/https";
import OpenAI from "openai";

// Define the OpenAI API key as a secret
const openaiApiKey = defineSecret("OPENAI_API_KEY");

// Types
interface DatosComida {
  nombre: string;
  cantidad: string;
  energia: string;
  carb: string;
  proteina: string;
  fibra: string;
  grasa: string;
}

interface PerfilNutricional {
  objetivos?: string | string[];
  preferenciaNutricional?: string;
  restricciones?: string[];
}

interface FeedbackRequest {
  datosComida: DatosComida;
  perfilNutricional?: PerfilNutricional;
}

interface FeedbackResponse {
  texto: string;
  calificacion: "Alto" | "Medio" | "Bajo";
}

/**
 * Genera feedback nutricional usando OpenAI
 */
export const generarFeedbackNutricional = onCall<FeedbackRequest>(
  {
    secrets: [openaiApiKey],
    cors: true,
  },
  async (request) => {
    try {
      const {datosComida, perfilNutricional} = request.data;

      if (!datosComida) {
        throw new Error("Datos de comida requeridos");
      }

      // Inicializar OpenAI con el secret
      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      });

      // Construir el prompt
      const prompt = construirPrompt(datosComida, perfilNutricional);

      // Llamar a la API de OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Eres un nutricionista experto que proporciona feedback nutricional personalizado. " +
              "Tu respuesta debe ser clara, educativa y útil. " +
              "Usa formato markdown con **texto en negrita** para resaltar conceptos importantes. " +
              "Responde siempre en español.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const respuesta = completion.choices[0]?.message?.content || "";

      // Extraer la calificación del feedback
      const calificacion = extraerCalificacion(respuesta);

      const feedback: FeedbackResponse = {
        texto: respuesta,
        calificacion,
      };

      logger.info("Feedback generado exitosamente", {
        nombreComida: datosComida.nombre,
        calificacion,
      });

      return feedback;
    } catch (error: any) {
      logger.error("Error al generar feedback nutricional", error);
      throw new Error(
        `Error al generar feedback: ${error.message || "Error desconocido"}`
      );
    }
  }
);

/**
 * Construye el prompt para OpenAI con la información nutricional
 */
function construirPrompt(
  datosComida: DatosComida,
  perfilNutricional?: PerfilNutricional
): string {
  let prompt = `Analiza esta comida y proporciona feedback nutricional:\n\n`;
  prompt += `**Información nutricional:**\n`;
  prompt += `- Nombre: ${datosComida.nombre || "No especificado"}\n`;
  prompt += `- Cantidad: ${datosComida.cantidad || "0"} gr\n`;
  prompt += `- Energía: ${datosComida.energia || "0"} Kcal\n`;
  prompt += `- Carbohidratos: ${datosComida.carb || "0"} gr\n`;
  prompt += `- Proteínas: ${datosComida.proteina || "0"} gr\n`;
  prompt += `- Fibra: ${datosComida.fibra || "0"} gr\n`;
  prompt += `- Grasa: ${datosComida.grasa || "0"} gr\n\n`;

  if (perfilNutricional) {
    prompt += `**Perfil del usuario:**\n`;
    if (perfilNutricional.objetivos) {
      const objetivos = Array.isArray(perfilNutricional.objetivos)
        ? perfilNutricional.objetivos.join(", ")
        : perfilNutricional.objetivos;
      prompt += `- Objetivos: ${objetivos}\n`;
    }
    if (perfilNutricional.preferenciaNutricional) {
      prompt += `- Preferencia nutricional: ${perfilNutricional.preferenciaNutricional}\n`;
    }
    if (
      perfilNutricional.restricciones &&
      perfilNutricional.restricciones.length > 0
    ) {
      prompt += `- Restricciones: ${perfilNutricional.restricciones.join(", ")}\n`;
    }
    prompt += `\n`;
  }

  prompt += `Proporciona un feedback nutricional detallado que incluya:\n`;
  prompt += `1. Una evaluación general del alimento\n`;
  prompt += `2. Cómo se alinea con los objetivos del usuario (si están disponibles)\n`;
  prompt += `3. Recomendaciones específicas para mejorar o complementar la comida\n`;
  prompt += `4. Al final, indica la calificación: [ALTO], [MEDIO] o [BAJO]\n\n`;
  prompt += `Responde en español y usa **texto en negrita** para resaltar conceptos importantes.`;

  return prompt;
}

/**
 * Extrae la calificación del texto de feedback
 */
function extraerCalificacion(texto: string): "Alto" | "Medio" | "Bajo" {
  const textoUpper = texto.toUpperCase();

  if (textoUpper.includes("[ALTO]") || textoUpper.includes("ALTO")) {
    return "Alto";
  } else if (textoUpper.includes("[BAJO]") || textoUpper.includes("BAJO")) {
    return "Bajo";
  } else {
    return "Medio";
  }
}

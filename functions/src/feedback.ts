import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import OpenAI from "openai";
import { openaiApiKey } from "./secrets";
import {
  DatosComida,
  FeedbackRequest,
  FeedbackResponse,
  IngredienteFeedback,
  PerfilNutricional,
} from "./types";
import { extraerCalificacion } from "./utils";

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
      const {datosComida, tipoComida, perfilNutricional, ingredientes} = request.data;

      if (!datosComida) {
        throw new Error("Datos de comida requeridos");
      }

      // Inicializar OpenAI con el secret
      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      });

      // Construir el prompt
      const prompt = construirPrompt(datosComida, tipoComida, perfilNutricional, ingredientes);

      // Llamar a la API de OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Eres un nutricionista experto que proporciona feedback nutricional personalizado. " +
              "Tu respuesta debe ser BREVE, clara y concisa (máximo 150 palabras). " +
              "Usa formato markdown con **texto en negrita** solo para los títulos de sección. " +
              "Responde siempre en español y asegúrate de incluir la calificación al final. " +
              "IMPORTANTE: Si se lista el desglose de ingredientes, analiza ÚNICAMENTE en base a esos ingredientes exactos. " +
              "No asumas ni inferras ingredientes que no estén explícitamente listados.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 400, // Reducido porque ahora pedimos respuestas más breves (máx 150 palabras)
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
      if (error instanceof HttpsError) throw error;
      logger.error("Error al generar feedback nutricional", error);
      throw new HttpsError("internal", `Error al generar feedback: ${error.message || "Error desconocido"}`);
    }
  }
);

/**
 * Construye el prompt para OpenAI con la información nutricional
 */
function construirPrompt(
  datosComida: DatosComida,
  tipoComida?: string,
  perfilNutricional?: PerfilNutricional,
  ingredientes?: IngredienteFeedback[]
): string {
  let prompt = `Analiza esta comida y proporciona feedback nutricional:\n\n`;
  prompt += `**Información nutricional:**\n`;
  prompt += `- Nombre: ${datosComida.nombre || "No especificado"}\n`;
  if (tipoComida) {
    prompt += `- Tipo de comida: ${tipoComida}\n`;
  }
  prompt += `- Cantidad: ${datosComida.cantidad || "0"} gr\n`;
  prompt += `- Energía: ${datosComida.energia || "0"} Kcal\n`;
  prompt += `- Carbohidratos: ${datosComida.carb || "0"} gr\n`;
  prompt += `- Proteínas: ${datosComida.proteina || "0"} gr\n`;
  prompt += `- Fibra: ${datosComida.fibra || "0"} gr\n`;
  prompt += `- Grasa: ${datosComida.grasa || "0"} gr\n\n`;

  if (ingredientes && ingredientes.length > 0) {
    prompt += `**Composición exacta del plato (analiza SOLO estos ingredientes, no hay otros):**\n`;
    for (const ing of ingredientes) {
      const peso = parseFloat(ing.peso) || 0;
      const energia = Math.round(ing.energiaPor100g * peso / 100);
      prompt += `- ${ing.nombre}: ${ing.peso} gr, ${energia} Kcal\n`;
    }
    prompt += `\n`;
  }

  if (perfilNutricional) {
    prompt += `**Perfil del usuario:**\n`;
    if (perfilNutricional.edad) {
      prompt += `- Edad: ${perfilNutricional.edad} años\n`;
    }
    if (perfilNutricional.sexo) {
      prompt += `- Sexo: ${perfilNutricional.sexo}\n`;
    }
    if (perfilNutricional.altura) {
      prompt += `- Altura: ${perfilNutricional.altura} cm\n`;
    }
    if (perfilNutricional.peso) {
      prompt += `- Peso: ${perfilNutricional.peso} kg\n`;
    }
    if (perfilNutricional.ejercicio) {
      prompt += `- Nivel de actividad física: ${perfilNutricional.ejercicio}\n`;
    }
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
      prompt += `- Restricciones dietéticas: ${perfilNutricional.restricciones.join(", ")}\n`;
    }
    prompt += `\n`;
  }

  prompt += `Proporciona un feedback nutricional BREVE y conciso que incluya:\n\n`;
  prompt += `1. **Evaluación del alimento** (2-3 oraciones máximo):`;
  if (tipoComida) {
    prompt += ` Evalúa considerando que es un ${tipoComida.toLowerCase()}.`;
  }
  prompt += `\n\n`;
  prompt += `2. **Alineación con objetivos** (1-2 oraciones máximo):`;
  if (perfilNutricional?.objetivos) {
    prompt += ` Explica brevemente cómo se alinea con los objetivos del usuario.`;
  } else {
    prompt += ` Si no hay objetivos específicos, omite este punto.`;
  }
  prompt += `\n\n`;
  prompt += `3. **Recomendaciones** (2-3 oraciones máximo):`;
  if (tipoComida) {
    prompt += ` Sugiere mejoras específicas para este ${tipoComida.toLowerCase()}.`;
  } else {
    prompt += ` Sugiere mejoras específicas.`;
  }
  prompt += `\n\n`;
  prompt += `4. **Calificación** (OBLIGATORIO al final, en una línea separada):\n`;
  prompt += `   Debes terminar EXACTAMENTE con una de estas líneas:\n`;
  prompt += `   - "Calificación: [MUY_SALUDABLE]"\n`;
  prompt += `   - "Calificación: [EQUILIBRADA]"\n`;
  prompt += `   - "Calificación: [POCO_NUTRITIVA]"\n\n`;
  prompt += `REGLAS IMPORTANTES:\n`;
  prompt += `- Sé BREVE: máximo 150 palabras en total\n`;
  prompt += `- Usa **texto en negrita** solo para los títulos de cada sección\n`;
  prompt += `- La calificación DEBE estar al final, en una línea separada\n`;
  prompt += `- Usa SOLO [MUY_SALUDABLE], [EQUILIBRADA] o [POCO_NUTRITIVA] - NO uses otras variantes\n`;
  prompt += `- Responde en español\n`;

  return prompt;
}

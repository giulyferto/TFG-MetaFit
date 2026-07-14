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
import { calificacionDesdePuntuacion } from "./utils";

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
              "Responde siempre en español y asegúrate de incluir la puntuación numérica al final. " +
              "IMPORTANTE: Si se lista el desglose de ingredientes, analiza ÚNICAMENTE en base a esos ingredientes exactos. " +
              "No asumas ni inferras ingredientes que no estén explícitamente listados. " +
              "REGLA INQUEBRANTABLE: si el nombre del plato o alguno de sus ingredientes contradice una restricción " +
              "dietética indicada por el usuario (por ejemplo contiene carne cuando el usuario es vegetariano/vegano, " +
              "o contiene gluten/lactosa cuando el usuario lo restringe), la puntuación NUNCA puede ser mayor a 40 " +
              "sin importar cuán buenos sean los macros, y el texto debe mencionar explícitamente ese conflicto " +
              "con la restricción. Si NO hay ningún conflicto con las restricciones, NO las menciones en la " +
              "respuesta bajo ningún motivo — ni para aclarar que 'no aplican' ni de ninguna otra forma. El " +
              "usuario ya sabe cuáles son sus restricciones; solo hace falta hablar de ellas cuando realmente " +
              "se violan.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2, // Baja para que la calificación siga la rúbrica de forma consistente, no creativa
        max_tokens: 400, // Reducido porque ahora pedimos respuestas más breves (máx 150 palabras)
      });

      const respuesta = completion.choices[0]?.message?.content || "";

      // Extraer la puntuación numérica del feedback y traducirla a calificación
      const calificacion = calificacionDesdePuntuacion(respuesta);

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
      prompt += `- Restricciones dietéticas (ESTRICTAS, no negociables): ${perfilNutricional.restricciones.join(", ")}\n`;
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
  prompt += `4. **Puntuación** (OBLIGATORIO al final, en una línea separada, de uso interno — el usuario no ve `;
  prompt += `este número tal cual, así que puede ser preciso):\n`;
  prompt += `   Asigná un entero de 0 a 100 que refleje qué tan buena es esta comida puntual, considerando en `;
  prompt += `conjunto: calidad nutricional general (ingredientes frescos/integrales vs. ultraprocesados, aporte `;
  prompt += `de proteína y/o fibra, excesos de azúcares añadidos/grasas saturadas/sodio), qué tan bien ayuda al `;
  prompt += `objetivo declarado del usuario, y si respeta sus restricciones dietéticas. Guía de rangos (NO `;
  prompt += `reserves el rango alto solo para comidas perfectas):\n`;
  prompt += `   - 70-100: plato mayoritariamente saludable — ingredientes frescos/integrales, buen aporte de `;
  prompt += `proteína Y/O fibra (con UNA de las dos alcanza, no hace falta que sobresalgan ambas), sin excesos `;
  prompt += `evidentes, sin violar ninguna restricción dietética, y que favorece o es neutral respecto al objetivo `;
  prompt += `del usuario (ej: si el objetivo es "Perder peso" o "Reducir grasa corporal", no debería ser excesiva `;
  prompt += `en calorías/grasa para el tipo de comida; si es "Ganar masa muscular", debería aportar proteína `;
  prompt += `razonable). Ejemplo: pechuga de pollo a la parrilla con ensalada (aunque la ensalada sea escasa) `;
  prompt += `debería puntuar en este rango — que le falte un poco de fibra no alcanza para bajarlo de acá.\n`;
  prompt += `   - 41-69: opción nutricionalmente razonable pero con más de una carencia relevante a la vez `;
  prompt += `(ej: baja en proteína Y baja en fibra, o algo procesada Y con exceso de algún macro), no un plato `;
  prompt += `limpio al que solo le falta un poco de fibra o vegetales. También aplica si es nutricionalmente `;
  prompt += `buena pero no colabora demasiado con el objetivo declarado del usuario (sin llegar a contradecirlo).\n`;
  prompt += `   - 0-40: predominan ultraprocesados, azúcares añadidos, grasas saturadas o sodio en exceso con `;
  prompt += `bajo aporte nutricional real; O viola alguna restricción dietética del usuario (en ese caso el `;
  prompt += `puntaje SIEMPRE debe estar en este rango, sin importar los macros); O contradice claramente el `;
  prompt += `objetivo declarado (ej: comida muy calórica/alta en grasa cuando el objetivo es "Perder peso" o `;
  prompt += `"Reducir grasa corporal"; comida con muy poca proteína cuando el objetivo es "Ganar masa muscular").\n`;
  prompt += `   Debes terminar EXACTAMENTE con esta línea (reemplazando XX por el número entero elegido):\n`;
  prompt += `   "Puntuación: [XX]"\n\n`;
  prompt += `REGLAS IMPORTANTES:\n`;
  prompt += `- Sé BREVE: máximo 150 palabras en total\n`;
  prompt += `- Usa **texto en negrita** solo para los títulos de cada sección\n`;
  prompt += `- La puntuación DEBE estar al final, en una línea separada, en el formato exacto "Puntuación: [XX]"\n`;
  prompt += `- Si el plato contradice una restricción dietética del usuario, decilo explícitamente en la `;
  prompt += `evaluación y la puntuación debe estar entre 0 y 40\n`;
  prompt += `- Si el plato NO contradice ninguna restricción, no la menciones para nada (ni siquiera para aclarar `;
  prompt += `que "no aplica" o "no se ve afectada") — es una aclaración innecesaria que no aporta valor\n`;
  prompt += `- Responde en español\n`;

  return prompt;
}

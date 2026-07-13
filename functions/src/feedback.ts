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
              "No asumas ni inferras ingredientes que no estén explícitamente listados. " +
              "REGLA INQUEBRANTABLE: si el nombre del plato o alguno de sus ingredientes contradice una restricción " +
              "dietética indicada por el usuario (por ejemplo contiene carne cuando el usuario es vegetariano/vegano, " +
              "o contiene gluten/lactosa cuando el usuario lo restringe), la calificación NUNCA puede ser " +
              "[MUY_SALUDABLE] ni [EQUILIBRADA] sin importar cuán buenos sean los macros — debe ser [POCO_NUTRITIVA], " +
              "y el texto debe mencionar explícitamente ese conflicto con la restricción. " +
              "Si NO hay ningún conflicto con las restricciones, NO las menciones en la respuesta bajo ningún " +
              "motivo — ni para aclarar que 'no aplican' ni de ninguna otra forma. El usuario ya sabe cuáles son " +
              "sus restricciones; solo hace falta hablar de ellas cuando realmente se violan.",
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
  prompt += `4. **Calificación** (OBLIGATORIO al final, en una línea separada):\n`;
  prompt += `   Usa estos criterios para decidir (NO reserves [MUY_SALUDABLE] solo para comidas perfectas). `;
  prompt += `La calificación debe considerar TANTO la calidad nutricional general COMO qué tan bien esta comida `;
  prompt += `puntual ayuda al objetivo del usuario — no son cosas separadas:\n`;
  prompt += `   - [MUY_SALUDABLE]: mayoritariamente ingredientes frescos/integrales, buen aporte de proteína `;
  prompt += `Y/O fibra (con UNA de las dos alcanza, no hace falta que sobresalgan ambas), sin excesos evidentes de `;
  prompt += `azúcares añadidos, grasas saturadas o ultraprocesados; SIN violar ninguna restricción dietética; Y además `;
  prompt += `favorece o es neutral respecto al objetivo del usuario (ej: si el objetivo es "Perder peso" o "Reducir `;
  prompt += `grasa corporal", no debería ser excesiva en calorías/grasa para el tipo de comida; si es "Ganar masa `;
  prompt += `muscular", debería aportar proteína razonable). No hace falta que sea impecable: un plato alto en `;
  prompt += `proteína magra y bajo en procesados sigue siendo [MUY_SALUDABLE] aunque tenga pocos vegetales o le `;
  prompt += `falte algo de fibra — eso es a lo sumo una sugerencia de mejora, NO motivo para bajarlo a [EQUILIBRADA]. `;
  prompt += `Ejemplo: pechuga de pollo a la parrilla con ensalada (aunque la ensalada sea escasa) es [MUY_SALUDABLE].\n`;
  prompt += `   - [EQUILIBRADA]: reservala para cuando hay más de una carencia relevante a la vez (ej: baja en `;
  prompt += `proteína Y baja en fibra, o algo procesada Y con exceso de algún macro), no para un plato limpio al `;
  prompt += `que solo le falta un poco de fibra o vegetales. También aplica si es nutricionalmente buena pero no `;
  prompt += `colabora demasiado con el objetivo declarado del usuario (sin llegar a contradecirlo). Tampoco debe `;
  prompt += `violar ninguna restricción dietética.\n`;
  prompt += `   - [POCO_NUTRITIVA]: predominan ultraprocesados, azúcares añadidos, grasas saturadas o sodio en `;
  prompt += `exceso con bajo aporte nutricional real; O viola alguna restricción dietética indicada por el usuario; `;
  prompt += `O contradice claramente el objetivo declarado (ej: comida muy calórica/alta en grasa cuando el objetivo `;
  prompt += `es "Perder peso" o "Reducir grasa corporal"; comida con muy poca proteína cuando el objetivo es `;
  prompt += `"Ganar masa muscular"). Cualquiera de estos tres casos alcanza para bajarla a [POCO_NUTRITIVA], `;
  prompt += `sin importar cuán buenos sean los demás factores.\n`;
  prompt += `   Debes terminar EXACTAMENTE con una de estas líneas:\n`;
  prompt += `   - "Calificación: [MUY_SALUDABLE]"\n`;
  prompt += `   - "Calificación: [EQUILIBRADA]"\n`;
  prompt += `   - "Calificación: [POCO_NUTRITIVA]"\n\n`;
  prompt += `REGLAS IMPORTANTES:\n`;
  prompt += `- Sé BREVE: máximo 150 palabras en total\n`;
  prompt += `- Usa **texto en negrita** solo para los títulos de cada sección\n`;
  prompt += `- La calificación DEBE estar al final, en una línea separada\n`;
  prompt += `- Usa SOLO [MUY_SALUDABLE], [EQUILIBRADA] o [POCO_NUTRITIVA] - NO uses otras variantes\n`;
  prompt += `- Si el plato contradice una restricción dietética del usuario, decilo explícitamente en la `;
  prompt += `evaluación y la calificación debe ser [POCO_NUTRITIVA]\n`;
  prompt += `- Si el plato NO contradice ninguna restricción, no la menciones para nada (ni siquiera para aclarar `;
  prompt += `que "no aplica" o "no se ve afectada") — es una aclaración innecesaria que no aporta valor\n`;
  prompt += `- Responde en español\n`;

  return prompt;
}

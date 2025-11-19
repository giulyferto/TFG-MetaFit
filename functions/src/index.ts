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
  tipoComida?: string;
  perfilNutricional?: PerfilNutricional;
}

interface FeedbackResponse {
  texto: string;
  calificacion: "Alta" | "Media" | "Baja";
}

interface AnalizarImagenRequest {
  imagenBase64: string;
}

interface AnalizarImagenResponse {
  esPlatoComida: boolean;
  datosComida?: DatosComida;
  mensaje?: string;
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
      const {datosComida, tipoComida, perfilNutricional} = request.data;

      if (!datosComida) {
        throw new Error("Datos de comida requeridos");
      }

      // Inicializar OpenAI con el secret
      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      });

      // Construir el prompt
      const prompt = construirPrompt(datosComida, tipoComida, perfilNutricional);

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
              "Responde siempre en español y asegúrate de incluir la calificación al final.",
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
  tipoComida?: string,
  perfilNutricional?: PerfilNutricional
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
  prompt += `   - "Calificación: [ALTA]"\n`;
  prompt += `   - "Calificación: [MEDIA]"\n`;
  prompt += `   - "Calificación: [BAJA]"\n\n`;
  prompt += `REGLAS IMPORTANTES:\n`;
  prompt += `- Sé BREVE: máximo 150 palabras en total\n`;
  prompt += `- Usa **texto en negrita** solo para los títulos de cada sección\n`;
  prompt += `- La calificación DEBE estar al final, en una línea separada\n`;
  prompt += `- Usa SOLO [ALTA], [MEDIA] o [BAJA] - NO uses "MEDIO" u otras variantes\n`;
  prompt += `- Responde en español\n`;

  return prompt;
}

/**
 * Extrae la calificación del texto de feedback
 * Busca primero los marcadores específicos [ALTA], [MEDIA], [BAJA]
 * y luego busca las palabras cerca del final del texto
 */
function extraerCalificacion(texto: string): "Alta" | "Media" | "Baja" {
  const textoUpper = texto.toUpperCase();

  // Buscar primero los marcadores específicos [ALTA], [MEDIA], [BAJA]
  // Estos son más confiables porque están en el formato solicitado
  if (textoUpper.includes("[BAJA]")) {
    return "Baja";
  }
  if (textoUpper.includes("[ALTA]")) {
    return "Alta";
  }
  if (textoUpper.includes("[MEDIA]")) {
    return "Media";
  }

  // Si no encuentra marcadores, buscar en las últimas 200 caracteres
  // donde normalmente está la calificación
  const ultimas200Caracteres = textoUpper.slice(-200);
  
  // Buscar patrones como "calificación: [BAJA]" o "calificación: BAJA"
  // También buscar "MEDIO" como variante de "MEDIA"
  const patronCalificacion = /CALIFICACI[ÓO]N\s*:?\s*\[?(BAJA|ALTA|MEDIA|MEDIO)\]?/i;
  const match = ultimas200Caracteres.match(patronCalificacion);
  
  if (match) {
    const calif = match[1].toUpperCase();
    if (calif === "BAJA") return "Baja";
    if (calif === "ALTA") return "Alta";
    // Normalizar "MEDIO" a "Media"
    if (calif === "MEDIA" || calif === "MEDIO") return "Media";
  }

  // Buscar las palabras sueltas en las últimas 200 caracteres
  // Priorizar BAJA sobre ALTA para evitar falsos positivos
  // También buscar variantes como "MEDIO" que OpenAI podría usar
  if (ultimas200Caracteres.includes("BAJA")) {
    return "Baja";
  }
  if (ultimas200Caracteres.includes("ALTA")) {
    return "Alta";
  }
  // Buscar tanto "MEDIA" como "MEDIO" (variante que OpenAI podría usar)
  if (ultimas200Caracteres.includes("MEDIA") || ultimas200Caracteres.includes("MEDIO")) {
    return "Media";
  }

  // Si no encuentra nada, retornar Media por defecto
  return "Media";
}

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
{
  "esPlatoComida": false,
  "mensaje": "La imagen no parece ser un plato de comida"
}

2. Si la imagen SÍ muestra un plato de comida, analiza la comida visible y estima sus valores nutricionales. Responde EXACTAMENTE con este JSON:
{
  "esPlatoComida": true,
  "datosComida": {
    "nombre": "nombre descriptivo del plato o comida",
    "cantidad": "cantidad estimada en gramos (solo número, sin unidades)",
    "energia": "energía en Kcal (solo número, sin unidades)",
    "carb": "carbohidratos en gramos (solo número, sin unidades)",
    "proteina": "proteínas en gramos (solo número, sin unidades)",
    "fibra": "fibra en gramos (solo número, sin unidades)",
    "grasa": "grasa en gramos (solo número, sin unidades)"
  }
}

IMPORTANTE:
- Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después
- Los valores numéricos deben ser números como strings (ej: "250", "450", "30")
- Si no puedes estimar un valor, usa "0"
- El nombre debe ser descriptivo y claro`,
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
        max_tokens: 500,
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

      // Validar que todos los campos estén presentes
      if (!resultado.datosComida) {
        throw new Error("No se pudieron extraer los datos nutricionales");
      }

      // Asegurar que todos los campos tengan valores por defecto
      const datosComida: DatosComida = {
        nombre: resultado.datosComida.nombre || "",
        cantidad: resultado.datosComida.cantidad || "0",
        energia: resultado.datosComida.energia || "0",
        carb: resultado.datosComida.carb || "0",
        proteina: resultado.datosComida.proteina || "0",
        fibra: resultado.datosComida.fibra || "0",
        grasa: resultado.datosComida.grasa || "0",
      };

      logger.info("Imagen analizada exitosamente", {
        esPlatoComida: true,
        nombre: datosComida.nombre,
      });

      return {
        esPlatoComida: true,
        datosComida,
      };
    } catch (error: any) {
      logger.error("Error al analizar imagen", error);
      throw new Error(
        `Error al analizar la imagen: ${error.message || "Error desconocido"}`
      );
    }
  }
);

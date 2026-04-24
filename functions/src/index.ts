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

interface IngredienteIA {
  nombre: string;
  pesoEstimado: number;
  energiaPor100g: number;
  carbPor100g: number;
  proteinaPor100g: number;
  fibraPor100g: number;
  grasaPor100g: number;
}

interface AnalizarImagenResponse {
  esPlatoComida: boolean;
  datosComida?: DatosComida;
  nombre?: string;
  ingredientes?: IngredienteIA[];
  mensaje?: string;
}

interface ObtenerNutricionRequest {
  nombre: string;
}

interface ObtenerNutricionResponse {
  energiaPor100g: number;
  carbPor100g: number;
  proteinaPor100g: number;
  fibraPor100g: number;
  grasaPor100g: number;
}

interface AnalizarCodigoBarrasRequest {
  imagenBase64: string;
}

interface AnalizarCodigoBarrasResponse {
  esCodigoBarras: boolean;
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
      logger.error("Error al analizar imagen", error);
      throw new Error(
        `Error al analizar la imagen: ${error.message || "Error desconocido"}`
      );
    }
  }
);

/**
 * Analiza una imagen para reconocer un código de barras y extraer información del producto nutricional
 */
export const analizarCodigoBarras = onCall<AnalizarCodigoBarrasRequest>(
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

      logger.info("Analizando código de barras con OpenAI Vision");

      // Llamar a OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Eres un experto en reconocimiento de códigos de barras y productos nutricionales. Analiza esta imagen y determina si contiene un código de barras de un producto alimenticio.

INSTRUCCIONES:
1. Si la imagen NO contiene un código de barras visible o no es un producto alimenticio, responde EXACTAMENTE con este JSON:
{
  "esCodigoBarras": false,
  "mensaje": "No se pudo reconocer un código de barras en la imagen"
}

2. Si la imagen SÍ contiene un código de barras de un producto alimenticio:
   - Intenta leer el código de barras (si es visible)
   - Identifica el producto alimenticio
   - Extrae la información nutricional del producto (puedes inferirla basándote en el tipo de producto si no está visible)
   - Responde EXACTAMENTE con este JSON:
{
  "esCodigoBarras": true,
  "datosComida": {
    "nombre": "nombre del producto identificado",
    "cantidad": "cantidad por porción en gramos (solo número, sin unidades)",
    "energia": "energía en Kcal por porción (solo número, sin unidades)",
    "carb": "carbohidratos en gramos por porción (solo número, sin unidades)",
    "proteina": "proteínas en gramos por porción (solo número, sin unidades)",
    "fibra": "fibra en gramos por porción (solo número, sin unidades)",
    "grasa": "grasa en gramos por porción (solo número, sin unidades)"
  }
}

IMPORTANTE:
- Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después
- Los valores numéricos deben ser números como strings (ej: "250", "450", "30")
- Si no puedes determinar un valor específico, usa valores estimados razonables basados en el tipo de producto
- El nombre debe ser descriptivo y claro del producto identificado
- Si puedes leer el código de barras, úsalo para identificar mejor el producto`,
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
      let resultado: AnalizarCodigoBarrasResponse;
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

      if (!resultado.esCodigoBarras) {
        return {
          esCodigoBarras: false,
          mensaje: resultado.mensaje || "No se pudo reconocer un código de barras en la imagen",
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

      logger.info("Código de barras analizado exitosamente", {
        esCodigoBarras: true,
        nombre: datosComida.nombre,
      });

      return {
        esCodigoBarras: true,
        datosComida,
      };
    } catch (error: any) {
      logger.error("Error al analizar código de barras", {
        error: error.message,
        stack: error.stack,
        code: error.code,
      });
      
      // Si es un error conocido, lanzarlo con más contexto
      if (error.message) {
        throw new Error(
          `Error al analizar el código de barras: ${error.message}`
        );
      }

      // Error desconocido
      throw new Error(
        "Error al analizar el código de barras: Error desconocido"
      );
    }
  }
);

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
      logger.error("Error al obtener nutrición del ingrediente", error);
      throw new Error(`Error al obtener valores nutricionales: ${error.message || "Error desconocido"}`);
    }
  }
);

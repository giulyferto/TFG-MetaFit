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
import { HttpsError, onCall } from "firebase-functions/v2/https";
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
  edad?: string;
  sexo?: string;
  altura?: string;
  peso?: string;
  ejercicio?: string;
  objetivos?: string | string[];
  preferenciaNutricional?: string;
  restricciones?: string[];
}

interface IngredienteFeedback {
  nombre: string;
  peso: string;
  energiaPor100g: number;
  carbPor100g: number;
  proteinaPor100g: number;
  fibraPor100g: number;
  grasaPor100g: number;
}

interface FeedbackRequest {
  datosComida: DatosComida;
  tipoComida?: string;
  perfilNutricional?: PerfilNutricional;
  ingredientes?: IngredienteFeedback[];
}

interface FeedbackResponse {
  texto: string;
  calificacion: "Muy saludable" | "Equilibrada" | "Poco nutritiva";
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
  encontrado: boolean;
  ean?: string;
}

interface LeerEtiquetaRequest {
  imagenBase64: string;
}

interface LeerEtiquetaResponse {
  encontrado: boolean;
  nombre?: string;
  cantidad?: number;       // porción recomendada en gramos
  energiaPor100g?: number;
  carbPor100g?: number;
  proteinaPor100g?: number;
  fibraPor100g?: number;
  grasaPor100g?: number;
}

// Lo que devuelve la IA cruda, antes de normalizar
interface LeerEtiquetaRaw {
  encontrado: boolean;
  nombre?: string;
  porcionGramos?: number;      // tamaño de la porción en la etiqueta
  refGramos?: number;          // gramos de referencia de los valores (100 si es por 100g, o igual a porcionGramos si es por porción)
  energia?: number;
  carb?: number;
  proteina?: number;
  fibra?: number;
  grasa?: number;
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

/**
 * Extrae la calificación del texto de feedback
 * Busca primero los marcadores específicos [ALTA], [MEDIA], [BAJA]
 * y luego busca las palabras cerca del final del texto
 */
function extraerCalificacion(texto: string): "Muy saludable" | "Equilibrada" | "Poco nutritiva" {
  const textoUpper = texto.toUpperCase();

  // Marcadores nuevos
  if (textoUpper.includes("[MUY_SALUDABLE]") || textoUpper.includes("[MUY SALUDABLE]")) {
    return "Muy saludable";
  }
  if (textoUpper.includes("[POCO_NUTRITIVA]") || textoUpper.includes("[POCO NUTRITIVA]") || textoUpper.includes("[POCO_NUTRITIVO]")) {
    return "Poco nutritiva";
  }
  if (textoUpper.includes("[EQUILIBRADA]") || textoUpper.includes("[EQUILIBRADO]")) {
    return "Equilibrada";
  }

  // Marcadores legacy [ALTA], [MEDIA], [BAJA] por si el modelo los usa
  if (textoUpper.includes("[ALTA]")) return "Muy saludable";
  if (textoUpper.includes("[BAJA]")) return "Poco nutritiva";
  if (textoUpper.includes("[MEDIA]")) return "Equilibrada";

  // Buscar en las últimas 200 caracteres
  const ultimas200 = textoUpper.slice(-200);
  const patron = /CALIFICACI[ÓO]N\s*:?\s*\[?(MUY[_ ]SALUDABLE|POCO[_ ]NUTRITIV[AO]|EQUILIBRAD[AO]|ALTA|MEDIA|BAJA|MEDIO)\]?/i;
  const match = ultimas200.match(patron);

  if (match) {
    const v = match[1].toUpperCase().replace(" ", "_");
    if (v === "MUY_SALUDABLE" || v === "ALTA") return "Muy saludable";
    if (v.startsWith("POCO") || v === "BAJA") return "Poco nutritiva";
    if (v.startsWith("EQUILIBR") || v === "MEDIA" || v === "MEDIO") return "Equilibrada";
  }

  // Palabras sueltas al final del texto
  if (ultimas200.includes("MUY SALUDABLE") || ultimas200.includes("MUY_SALUDABLE")) return "Muy saludable";
  if (ultimas200.includes("POCO NUTRITIV") || ultimas200.includes("POCO_NUTRITIV")) return "Poco nutritiva";
  if (ultimas200.includes("EQUILIBRAD")) return "Equilibrada";

  return "Equilibrada";
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
      if (error instanceof HttpsError) throw error;
      logger.error("Error al analizar imagen", error);
      throw new HttpsError("internal", `Error al analizar la imagen: ${error.message || "Error desconocido"}`);
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

import type { DatosComida } from "@/features/shared/components/DetallesComidaCard";
import { functions } from "@/firebase";
import { httpsCallable } from "firebase/functions";
import type { IngredienteGuardado } from "./comidas";
import { getNutritionalProfile } from "./nutritional-profile";

export type FeedbackNutricional = {
  texto: string;
  calificacion: "Muy saludable" | "Equilibrada" | "Poco nutritiva";
};

/**
 * Genera feedback nutricional usando Firebase Functions con OpenAI
 * @param datosComida - Datos nutricionales de la comida
 * @param tipoComida - Tipo de comida (Desayuno, Almuerzo, Cena, etc.)
 * @returns Promise con el feedback generado
 */
export async function generarFeedbackNutricional(
  datosComida: DatosComida,
  tipoComida?: string,
  ingredientes?: IngredienteGuardado[]
): Promise<FeedbackNutricional> {
  try {
    // Obtener el perfil nutricional del usuario si está disponible
    const perfilNutricional = await getNutritionalProfile();

    // Preparar el perfil para enviar a la función
    const perfilParaEnviar = perfilNutricional
      ? {
          edad: perfilNutricional.edad,
          sexo: perfilNutricional.sexo,
          altura: perfilNutricional.altura,
          peso: perfilNutricional.peso,
          ejercicio: perfilNutricional.ejercicio,
          objetivos: perfilNutricional.objetivos,
          preferenciaNutricional: perfilNutricional.preferenciaNutricional,
          restricciones: perfilNutricional.restricciones,
        }
      : undefined;

    // Obtener la función callable
    const generarFeedback = httpsCallable<
      {
        datosComida: DatosComida;
        tipoComida?: string;
        perfilNutricional?: {
          edad?: string;
          sexo?: string;
          altura?: string;
          peso?: string;
          ejercicio?: string;
          objetivos?: string | string[];
          preferenciaNutricional?: string;
          restricciones?: string[];
        };
        ingredientes?: IngredienteGuardado[];
      },
      FeedbackNutricional
    >(functions, "generarFeedbackNutricional");

    // Llamar a la función
    const result = await generarFeedback({
      datosComida,
      tipoComida,
      perfilNutricional: perfilParaEnviar,
      ingredientes,
    });

    return result.data;
  } catch (error: any) {
    console.error("Error al generar feedback nutricional:", error);
    
    // Proporcionar mensajes de error más específicos
    let mensajeError = "No se pudo generar el feedback en este momento.";
    
    if (error.code === "functions/internal") {
      mensajeError = "Error interno del servidor. Por favor, intenta nuevamente más tarde.";
    } else if (error.code === "functions/not-found") {
      mensajeError = "La función no está disponible. Por favor, contacta al soporte.";
    } else if (error.code === "functions/permission-denied") {
      mensajeError = "No tienes permiso para usar esta función. Por favor, inicia sesión.";
    } else if (error.message?.includes("network") || error.message?.includes("connection")) {
      mensajeError = "Error de conexión. Por favor, verifica tu internet e intenta nuevamente.";
    }
    
    // Retornar un feedback por defecto en caso de error
    return {
      texto: mensajeError,
      calificacion: "Equilibrada",
    };
  }
}

export type IngredienteIA = {
  nombre: string;
  pesoEstimado: number;
  energiaPor100g: number;
  carbPor100g: number;
  proteinaPor100g: number;
  fibraPor100g: number;
  grasaPor100g: number;
};

export type AnalizarImagenResponse = {
  esPlatoComida: boolean;
  datosComida?: DatosComida;
  nombre?: string;
  ingredientes?: IngredienteIA[];
  mensaje?: string;
};

export type NutricionPor100g = {
  energiaPor100g: number;
  carbPor100g: number;
  proteinaPor100g: number;
  fibraPor100g: number;
  grasaPor100g: number;
};

function traducirErrorFirebase(error: any, mensajePorDefecto: string): string {
  const msg: string = error.message || "";

  if (error.code === "functions/not-found")
    return "La función no está disponible. Por favor, contacta al soporte.";
  if (error.code === "functions/permission-denied")
    return "No tienes permiso para usar esta función. Por favor, inicia sesión.";
  if (msg.includes("network") || msg.includes("connection") || msg.includes("fetch"))
    return "Error de conexión. Por favor, verifica tu internet e intentá nuevamente.";
  if (msg.includes("unsupported image") || msg.includes("supported image") || msg.includes("image format"))
    return "Formato de imagen no compatible. Por favor, tomá la foto directamente con la cámara o usá una imagen JPG/PNG.";
  if (msg.includes("quota") || msg.includes("rate limit") || msg.includes("429"))
    return "El servicio está temporalmente ocupado. Por favor, intentá nuevamente en unos segundos.";

  // Si el mensaje del servidor es el genérico de Firebase, usar el por defecto
  if (msg.toLowerCase() === "internal" || msg === "") return mensajePorDefecto;

  // Propagar el mensaje real del servidor
  return msg;
}

/**
 * Analiza una imagen para determinar si es un plato de comida y extraer datos nutricionales
 */
export async function analizarImagenComida(
  imagenBase64: string
): Promise<AnalizarImagenResponse> {
  try {
    const analizarImagen = httpsCallable<
      { imagenBase64: string },
      AnalizarImagenResponse
    >(functions, "analizarImagenComida");
    const result = await analizarImagen({ imagenBase64 });
    return result.data;
  } catch (error: any) {
    console.error("Error al analizar imagen:", error.code, error.message);
    throw new Error(traducirErrorFirebase(error, "No se pudo analizar la imagen en este momento."));
  }
}

export async function obtenerNutricionIngrediente(nombre: string): Promise<NutricionPor100g> {
  const fn = httpsCallable<{ nombre: string }, NutricionPor100g>(functions, "obtenerNutricionIngrediente");
  const result = await fn({ nombre });
  return result.data;
}

export type LeerEANResponse = {
  encontrado: boolean;
  ean?: string;
};

export type LeerEtiquetaResponse = {
  encontrado: boolean;
  nombre?: string;
  cantidad?: number;
  energiaPor100g?: number;
  carbPor100g?: number;
  proteinaPor100g?: number;
  fibraPor100g?: number;
  grasaPor100g?: number;
};

/**
 * Usa GPT-4o para leer la tabla nutricional de la foto de un envase.
 */
export async function leerEtiquetaNutricional(imagenBase64: string): Promise<LeerEtiquetaResponse> {
  try {
    const fn = httpsCallable<{ imagenBase64: string }, LeerEtiquetaResponse>(
      functions,
      "leerEtiquetaNutricional"
    );
    const result = await fn({ imagenBase64 });
    return result.data;
  } catch (error: any) {
    console.error("Error al leer tabla nutricional:", error.code, error.message);
    throw new Error(traducirErrorFirebase(error, "No se pudo leer la tabla nutricional."));
  }
}

export type AnalizarPatronResponse = {
  analisis: string;
  resumen: {
    puntosFuertes: string[];
    puntosDébiles: string[];
    recomendaciones: string[];
  };
  calificacionGeneral: "Muy saludable" | "Equilibrada" | "Poco nutritiva";
};

export async function analizarPatronAlimenticio(
  consumos: { id: string; nombre?: string; tipoComida?: string; fechaCreacion: string; energia?: string; carb?: string; proteina?: string; fibra?: string; grasa?: string; calificacion?: string | null }[],
  rangoFechas: string,
  perfilNutricional?: Record<string, any>
): Promise<AnalizarPatronResponse> {
  try {
    const fn = httpsCallable<
      { consumos: typeof consumos; rangoFechas: string; perfilNutricional?: Record<string, any> },
      AnalizarPatronResponse
    >(functions, "analizarPatronAlimenticio");
    const result = await fn({ consumos, rangoFechas, perfilNutricional });
    return result.data;
  } catch (error: any) {
    console.error("Error al analizar patrón alimenticio:", error.code, error.message);
    throw new Error(traducirErrorFirebase(error, "No se pudo analizar el patrón alimenticio."));
  }
}

/**
 * Usa GPT-4o para leer los dígitos impresos debajo del código de barras en una imagen.
 * Fallback cuando expo-camera no puede detectar el código en tiempo real.
 */
export async function leerEANDeImagen(imagenBase64: string): Promise<LeerEANResponse> {
  try {
    const fn = httpsCallable<{ imagenBase64: string }, LeerEANResponse>(
      functions,
      "analizarCodigoBarras"
    );
    const result = await fn({ imagenBase64 });
    return result.data;
  } catch (error: any) {
    console.error("Error al leer EAN:", error.code, error.message);
    throw new Error(traducirErrorFirebase(error, "No se pudieron leer los dígitos del código de barras."));
  }
}


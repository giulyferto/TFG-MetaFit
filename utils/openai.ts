import type { DatosComida } from "@/components/formulario-comida/DetallesComidaCard";
import { functions } from "@/firebase";
import { httpsCallable } from "firebase/functions";
import { getNutritionalProfile } from "./nutritional-profile";

export type FeedbackNutricional = {
  texto: string;
  calificacion: "Alta" | "Media" | "Baja";
};

/**
 * Genera feedback nutricional usando Firebase Functions con OpenAI
 * @param datosComida - Datos nutricionales de la comida
 * @param tipoComida - Tipo de comida (Desayuno, Almuerzo, Cena, etc.)
 * @returns Promise con el feedback generado
 */
export async function generarFeedbackNutricional(
  datosComida: DatosComida,
  tipoComida?: string
): Promise<FeedbackNutricional> {
  try {
    // Obtener el perfil nutricional del usuario si está disponible
    const perfilNutricional = await getNutritionalProfile();

    // Preparar el perfil para enviar a la función
    const perfilParaEnviar = perfilNutricional
      ? {
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
          objetivos?: string | string[];
          preferenciaNutricional?: string;
          restricciones?: string[];
        };
      },
      FeedbackNutricional
    >(functions, "generarFeedbackNutricional");

    // Llamar a la función
    const result = await generarFeedback({
      datosComida,
      tipoComida,
      perfilNutricional: perfilParaEnviar,
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
      calificacion: "Media",
    };
  }
}

export type AnalizarImagenResponse = {
  esPlatoComida: boolean;
  datosComida?: DatosComida;
  mensaje?: string;
};

/**
 * Analiza una imagen para determinar si es un plato de comida y extraer datos nutricionales
 * @param imagenBase64 - Imagen en formato base64
 * @returns Promise con el resultado del análisis
 */
export async function analizarImagenComida(
  imagenBase64: string
): Promise<AnalizarImagenResponse> {
  try {
    // Obtener la función callable
    const analizarImagen = httpsCallable<
      { imagenBase64: string },
      AnalizarImagenResponse
    >(functions, "analizarImagenComida");

    // Llamar a la función
    const result = await analizarImagen({ imagenBase64 });

    return result.data;
  } catch (error: any) {
    console.error("Error al analizar imagen:", error);
    
    // Proporcionar mensajes de error más específicos
    let mensajeError = "No se pudo analizar la imagen en este momento.";
    
    if (error.code === "functions/internal") {
      mensajeError = "Error interno del servidor. Por favor, intenta nuevamente más tarde.";
    } else if (error.code === "functions/not-found") {
      mensajeError = "La función no está disponible. Por favor, contacta al soporte.";
    } else if (error.code === "functions/permission-denied") {
      mensajeError = "No tienes permiso para usar esta función. Por favor, inicia sesión.";
    } else if (error.message?.includes("network") || error.message?.includes("connection")) {
      mensajeError = "Error de conexión. Por favor, verifica tu internet e intenta nuevamente.";
    }
    
    throw new Error(mensajeError);
  }
}

export type AnalizarCodigoBarrasResponse = {
  esCodigoBarras: boolean;
  datosComida?: DatosComida;
  mensaje?: string;
};

/**
 * Analiza una imagen para reconocer un código de barras y extraer información del producto nutricional
 * @param imagenBase64 - Imagen en formato base64
 * @returns Promise con el resultado del análisis
 */
export async function analizarCodigoBarras(
  imagenBase64: string
): Promise<AnalizarCodigoBarrasResponse> {
  try {
    // Obtener la función callable
    const analizarCodigo = httpsCallable<
      { imagenBase64: string },
      AnalizarCodigoBarrasResponse
    >(functions, "analizarCodigoBarras");

    // Llamar a la función
    const result = await analizarCodigo({ imagenBase64 });

    return result.data;
  } catch (error: any) {
    console.error("Error al analizar código de barras:", error);
    
    // Proporcionar mensajes de error más específicos
    let mensajeError = "No se pudo analizar el código de barras en este momento.";
    
    if (error.code === "functions/internal") {
      mensajeError = "Error interno del servidor. Por favor, intenta nuevamente más tarde.";
    } else if (error.code === "functions/not-found") {
      mensajeError = "La función no está disponible. Por favor, contacta al soporte.";
    } else if (error.code === "functions/permission-denied") {
      mensajeError = "No tienes permiso para usar esta función. Por favor, inicia sesión.";
    } else if (error.message?.includes("network") || error.message?.includes("connection")) {
      mensajeError = "Error de conexión. Por favor, verifica tu internet e intenta nuevamente.";
    }
    
    throw new Error(mensajeError);
  }
}


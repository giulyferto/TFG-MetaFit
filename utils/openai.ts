import { httpsCallable } from "firebase/functions";
import type { DatosComida } from "@/components/formulario-comida/DetallesComidaCard";
import { functions } from "@/firebase";
import { getNutritionalProfile } from "./nutritional-profile";

export type FeedbackNutricional = {
  texto: string;
  calificacion: "Alto" | "Medio" | "Bajo";
};

/**
 * Genera feedback nutricional usando Firebase Functions con OpenAI
 * @param datosComida - Datos nutricionales de la comida
 * @returns Promise con el feedback generado
 */
export async function generarFeedbackNutricional(
  datosComida: DatosComida
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
      perfilNutricional: perfilParaEnviar,
    });

    return result.data;
  } catch (error: any) {
    console.error("Error al generar feedback nutricional:", error);
    
    // Retornar un feedback por defecto en caso de error
    return {
      texto:
        "No se pudo generar el feedback en este momento. Por favor, verifica tu conexión a internet e intenta nuevamente.",
      calificacion: "Medio",
    };
  }
}


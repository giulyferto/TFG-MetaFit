/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

export { generarFeedbackNutricional } from "./feedback";
export { analizarImagenComida } from "./analizar-imagen";
export { analizarCodigoBarras } from "./codigo-barras";
export { obtenerNutricionIngrediente } from "./nutricion-ingrediente";
export { analizarPatronAlimenticio } from "./patron-alimenticio";
export { leerEtiquetaNutricional } from "./etiqueta-nutricional";

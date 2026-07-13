export interface DatosComida {
  nombre: string;
  cantidad: string;
  energia: string;
  carb: string;
  proteina: string;
  fibra: string;
  grasa: string;
}

export interface PerfilNutricional {
  edad?: string;
  sexo?: string;
  altura?: string;
  peso?: string;
  ejercicio?: string;
  objetivos?: string | string[];
  preferenciaNutricional?: string;
  restricciones?: string[];
}

export interface IngredienteFeedback {
  nombre: string;
  peso: string;
  energiaPor100g: number;
  carbPor100g: number;
  proteinaPor100g: number;
  fibraPor100g: number;
  grasaPor100g: number;
}

export interface FeedbackRequest {
  datosComida: DatosComida;
  tipoComida?: string;
  perfilNutricional?: PerfilNutricional;
  ingredientes?: IngredienteFeedback[];
}

export interface FeedbackResponse {
  texto: string;
  calificacion: "Muy saludable" | "Equilibrada" | "Poco nutritiva";
}

export interface AnalizarImagenRequest {
  imagenBase64: string;
}

export interface IngredienteIA {
  nombre: string;
  pesoEstimado: number;
  energiaPor100g: number;
  carbPor100g: number;
  proteinaPor100g: number;
  fibraPor100g: number;
  grasaPor100g: number;
}

export interface AnalizarImagenResponse {
  esPlatoComida: boolean;
  datosComida?: DatosComida;
  nombre?: string;
  ingredientes?: IngredienteIA[];
  mensaje?: string;
}

export interface ObtenerNutricionRequest {
  nombre: string;
}

export interface ObtenerNutricionResponse {
  energiaPor100g: number;
  carbPor100g: number;
  proteinaPor100g: number;
  fibraPor100g: number;
  grasaPor100g: number;
}

export interface AnalizarCodigoBarrasRequest {
  imagenBase64: string;
}

export interface AnalizarCodigoBarrasResponse {
  encontrado: boolean;
  ean?: string;
}

export interface LeerEtiquetaRequest {
  imagenBase64: string;
}

export interface LeerEtiquetaResponse {
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
export interface LeerEtiquetaRaw {
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

export interface ConsumoParaAnalisis {
  nombre?: string;
  tipoComida?: string;
  fechaCreacion: string;
  energia?: string;
  carb?: string;
  proteina?: string;
  fibra?: string;
  grasa?: string;
  calificacion?: string | null;
}

export interface AnalizarPatronRequest {
  consumos: ConsumoParaAnalisis[];
  rangoFechas: string;
  perfilNutricional?: PerfilNutricional;
}

export interface AnalizarPatronResponse {
  analisis: string;
  resumen: {
    puntosFuertes: string[];
    puntosDébiles: string[];
    recomendaciones: string[];
  };
  calificacionGeneral: "Muy saludable" | "Equilibrada" | "Poco nutritiva";
}

/**
 * Extrae la calificación del texto de feedback
 * Busca primero los marcadores específicos [ALTA], [MEDIA], [BAJA]
 * y luego busca las palabras cerca del final del texto
 */
export function extraerCalificacion(texto: string): "Muy saludable" | "Equilibrada" | "Poco nutritiva" {
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

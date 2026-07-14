/**
 * Extrae la puntuación numérica (0-100, de uso interno) del texto de feedback
 * y la traduce a la categoría correspondiente:
 * 0-40 Poco nutritiva, 41-69 Equilibrada, 70-100 Muy saludable.
 */
export function calificacionDesdePuntuacion(texto: string): "Muy saludable" | "Equilibrada" | "Poco nutritiva" {
  const match = texto.match(/Puntuaci[óo]n\s*:?\s*\[?(\d{1,3})\]?/i);

  if (match) {
    const puntaje = Math.min(100, Math.max(0, parseInt(match[1], 10)));
    if (puntaje >= 70) return "Muy saludable";
    if (puntaje >= 41) return "Equilibrada";
    return "Poco nutritiva";
  }

  return "Equilibrada";
}

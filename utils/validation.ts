/**
 * Valida que un valor sea un número válido (enteros o decimales)
 * @param valor - El valor a validar
 * @returns true si el valor es válido (vacío, número entero o decimal), false en caso contrario
 */
export function esNumeroValido(valor: string): boolean {
  // Permite solo números y un punto decimal opcional
  // El regex permite: números, un punto decimal opcional, y más números después del punto
  const regex = /^[0-9]*\.?[0-9]*$/;
  return valor === "" || regex.test(valor);
}

/**
 * Filtra un valor para mantener solo números y un punto decimal
 * @param valor - El valor a filtrar
 * @returns El valor filtrado (solo números y punto decimal) o string vacío si no es válido
 */
export function filtrarNumero(valor: string): string {
  // Remueve todos los caracteres que no sean números o punto decimal
  return valor.replace(/[^0-9.]/g, "");
}


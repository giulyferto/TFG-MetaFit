export type ProductoOFF = {
  nombre: string;
  cantidad: number;
  energiaPor100g: number;
  carbPor100g: number;
  proteinaPor100g: number;
  fibraPor100g: number;
  grasaPor100g: number;
};

export async function buscarProductoPorEAN(ean: string): Promise<ProductoOFF | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${ean}.json?fields=product_name,nutriments,serving_quantity`
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data.status !== 1 || !data.product) return null;

    const { product } = data;
    const n = product.nutriments ?? {};

    const energiaPor100g = Number(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0);
    const carbPor100g    = Number(n["carbohydrates_100g"] ?? n.carbohydrates ?? 0);
    const proteinaPor100g = Number(n["proteins_100g"] ?? n.proteins ?? 0);
    const fibraPor100g   = Number(n["fiber_100g"] ?? n.fiber ?? 0);
    const grasaPor100g   = Number(n["fat_100g"] ?? n.fat ?? 0);

    // Si no hay datos nutricionales útiles no sirve
    if (energiaPor100g === 0 && carbPor100g === 0 && proteinaPor100g === 0) return null;

    const nombre = (product.product_name || "").trim();
    if (!nombre) return null;

    const cantidad = parseFloat(product.serving_quantity) || 100;

    return {
      nombre,
      cantidad,
      energiaPor100g: Math.round(energiaPor100g),
      carbPor100g:    Math.round(carbPor100g * 10) / 10,
      proteinaPor100g: Math.round(proteinaPor100g * 10) / 10,
      fibraPor100g:   Math.round(fibraPor100g * 10) / 10,
      grasaPor100g:   Math.round(grasaPor100g * 10) / 10,
    };
  } catch {
    return null;
  }
}

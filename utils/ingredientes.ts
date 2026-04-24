import type { IngredienteIA } from "./openai";

export type Ingrediente = {
  id: string;
  nombre: string;
  peso: string; // grams — editable by user
  energiaPor100g: number;
  carbPor100g: number;
  proteinaPor100g: number;
  fibraPor100g: number;
  grasaPor100g: number;
};

export type MacrosCalculados = {
  energia: number;
  carb: number;
  proteina: number;
  fibra: number;
  grasa: number;
};

export function calcularMacros(ing: Ingrediente): MacrosCalculados {
  const p = parseFloat(ing.peso) || 0;
  return {
    energia: Math.round(ing.energiaPor100g * p / 100),
    carb: Math.round(ing.carbPor100g * p / 100 * 10) / 10,
    proteina: Math.round(ing.proteinaPor100g * p / 100 * 10) / 10,
    fibra: Math.round(ing.fibraPor100g * p / 100 * 10) / 10,
    grasa: Math.round(ing.grasaPor100g * p / 100 * 10) / 10,
  };
}

export function calcularTotales(ingredientes: Ingrediente[]): MacrosCalculados {
  return ingredientes.reduce(
    (acc, ing) => {
      const m = calcularMacros(ing);
      return {
        energia: acc.energia + m.energia,
        carb: Math.round((acc.carb + m.carb) * 10) / 10,
        proteina: Math.round((acc.proteina + m.proteina) * 10) / 10,
        fibra: Math.round((acc.fibra + m.fibra) * 10) / 10,
        grasa: Math.round((acc.grasa + m.grasa) * 10) / 10,
      };
    },
    { energia: 0, carb: 0, proteina: 0, fibra: 0, grasa: 0 }
  );
}

export function ingredienteDesdeIA(ia: IngredienteIA, id: string): Ingrediente {
  return {
    id,
    nombre: ia.nombre,
    peso: String(ia.pesoEstimado),
    energiaPor100g: ia.energiaPor100g,
    carbPor100g: ia.carbPor100g,
    proteinaPor100g: ia.proteinaPor100g,
    fibraPor100g: ia.fibraPor100g,
    grasaPor100g: ia.grasaPor100g,
  };
}

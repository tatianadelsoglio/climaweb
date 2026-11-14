export type Unidad = "C" | "F";

export const UNIDAD_INICIAL: Unidad = "C";

export function esUnidad(valor: unknown): valor is Unidad {
  return valor === "C" || valor === "F";
}

/** Convierte grados Celsius a la unidad pedida (la API siempre responde en Celsius). */
export function convertirTemperatura(celsius: number, unidad: Unidad): number {
  return unidad === "F" ? (celsius * 9) / 5 + 32 : celsius;
}

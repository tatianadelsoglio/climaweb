// Import relativo: este módulo también corre en el runner de tests de Node, sin alias.
import type { DiaPronostico } from "../types/clima.ts";

/** Día calendario en el huso de la ciudad, como «2026-11-14». */
export function claveDiaLocal(instante: number, zonaHoraria: number): string {
  return new Date((instante + zonaHoraria) * 1000).toISOString().slice(0, 10);
}

export interface PronosticoLocal {
  /** El día de hoy en la ciudad; null si el pronóstico no lo trae o vino inválido. */
  hoy: DiaPronostico | null;
  /** Los días posteriores a hoy, en orden. */
  siguientes: DiaPronostico[];
}

/**
 * Separa «hoy» de los días siguientes comparando FECHAS con el día local de la
 * ciudad, nunca por posición: si el primer día del proveedor no es hoy (vino
 * inválido y se descartó, o es una respuesta cacheada de ayer después de la
 * medianoche local), «hoy» queda en null en lugar de mostrar otro día con esa
 * etiqueta. Los días anteriores a hoy se descartan.
 */
export function separarHoy(
  dias: DiaPronostico[],
  momento: number,
  zonaHoraria: number,
): PronosticoLocal {
  const hoy = claveDiaLocal(momento, zonaHoraria);
  return {
    hoy: dias.find((dia) => dia.fecha === hoy) ?? null,
    siguientes: dias.filter((dia) => dia.fecha > hoy),
  };
}

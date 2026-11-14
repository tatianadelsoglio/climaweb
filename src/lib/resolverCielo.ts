import type { ClimaActual } from "@/types/clima";

export type Cielo =
  | "clear-day"
  | "clear-night"
  | "clouds-day"
  | "clouds-night"
  | "rain"
  | "storm"
  | "snow"
  | "mist";

/** Cielo del estado inicial y de la búsqueda sin resultados (el del .pen). */
export const CIELO_INICIAL: Cielo = "clear-day";

/** Cielo de los errores del servicio (el del .pen). */
export const CIELO_ERROR_SERVICIO: Cielo = "rain";

type DatosCielo = Pick<
  ClimaActual,
  "condicion" | "momento" | "amanecer" | "atardecer" | "zonaHoraria"
>;

const SEGUNDOS_POR_DIA = 86_400;
const SEGUNDOS_POR_HORA = 3_600;
// Respaldo para el día o la noche polar, cuando no hay amanecer ni atardecer.
const HORA_INICIO_DIA = 6;
const HORA_FIN_DIA = 20;

/** Segundos transcurridos desde la medianoche local de la ciudad. */
function segundosDelDiaLocal(instante: number, zonaHoraria: number): number {
  const local = (instante + zonaHoraria) % SEGUNDOS_POR_DIA;
  return local < 0 ? local + SEGUNDOS_POR_DIA : local;
}

/**
 * Indica si es de día en la ciudad, con su amanecer, atardecer y huso horario
 * (nunca con el reloj del usuario). Se comparan horas del día locales porque
 * OpenWeather puede informar el amanecer o el atardecer de otra fecha.
 */
export function esDeDia({
  momento,
  amanecer,
  atardecer,
  zonaHoraria,
}: Omit<DatosCielo, "condicion">): boolean {
  const ahora = segundosDelDiaLocal(momento, zonaHoraria);

  if (amanecer === null || atardecer === null) {
    const hora = ahora / SEGUNDOS_POR_HORA;
    return hora >= HORA_INICIO_DIA && hora < HORA_FIN_DIA;
  }

  const inicio = segundosDelDiaLocal(amanecer, zonaHoraria);
  const fin = segundosDelDiaLocal(atardecer, zonaHoraria);
  return inicio <= fin
    ? ahora >= inicio && ahora < fin
    : ahora >= inicio || ahora < fin;
}

/** Traduce el código de condición de OpenWeather y la hora local a un cielo. */
export function resolverCielo(datos: DatosCielo): Cielo {
  const { codigo } = datos.condicion;
  const grupo = Math.floor(codigo / 100);

  if (grupo === 2) return "storm";
  if (grupo === 3 || grupo === 5) return "rain";
  if (grupo === 6) return "snow";
  if (grupo === 7) return "mist";

  const dia = esDeDia(datos);
  if (codigo >= 802 && codigo <= 804) return dia ? "clouds-day" : "clouds-night";
  // 800, 801 (pocas nubes: el cielo sigue despejado) y cualquier código desconocido.
  return dia ? "clear-day" : "clear-night";
}

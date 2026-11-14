// Import relativo: este módulo también corre en el runner de tests de Node, sin alias.
import type { DiaPronostico } from "../types/clima.ts";

/** Franja de 3 horas del pronóstico, normalizada: Celsius, instante en segundos Unix (UTC). */
export interface FranjaPronostico {
  instante: number;
  temperatura: number;
  minima: number;
  maxima: number;
  /** Código de condición de OpenWeather. */
  codigo: number;
  /** Probabilidad de lluvia, de 0 a 100. */
  probabilidadLluvia: number;
}

export const DIAS_PRONOSTICO = 5;
const SEGUNDOS_POR_DIA = 86_400;
const SEGUNDOS_POR_HORA = 3_600;
const HORA_REPRESENTATIVA = 12;

function esNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function franjaDeOpenWeather(item: unknown): FranjaPronostico | null {
  if (!esObjeto(item) || !esObjeto(item.main) || !Array.isArray(item.weather)) {
    return null;
  }
  const [condicion]: unknown[] = item.weather;
  if (
    !esNumero(item.dt) ||
    !esNumero(item.main.temp) ||
    !esNumero(item.main.temp_min) ||
    !esNumero(item.main.temp_max) ||
    !esObjeto(condicion) ||
    !esNumero(condicion.id)
  ) {
    return null;
  }
  // `pop` va de 0 a 1 y puede faltar.
  const pop = esNumero(item.pop) ? Math.min(Math.max(item.pop, 0), 1) : 0;
  return {
    instante: item.dt,
    temperatura: item.main.temp,
    minima: item.main.temp_min,
    maxima: item.main.temp_max,
    codigo: condicion.id,
    probabilidadLluvia: Math.round(pop * 100),
  };
}

/** Franjas válidas de la respuesta de /forecast de OpenWeather (las inválidas se descartan). */
export function extraerFranjas(datos: unknown): FranjaPronostico[] {
  if (!esObjeto(datos) || !Array.isArray(datos.list)) return [];
  const franjas: FranjaPronostico[] = [];
  for (const item of datos.list as unknown[]) {
    const franja = franjaDeOpenWeather(item);
    if (franja) franjas.push(franja);
  }
  return franjas.sort((a, b) => a.instante - b.instante);
}

/** Día calendario en el huso de la ciudad, como «2026-11-14». */
export function claveDiaLocal(instante: number, zonaHoraria: number): string {
  return new Date((instante + zonaHoraria) * 1000).toISOString().slice(0, 10);
}

/** Hora local de la ciudad como número decimal (15.5 = 15:30). */
function horaLocal(instante: number, zonaHoraria: number): number {
  const local = (instante + zonaHoraria) % SEGUNDOS_POR_DIA;
  return (local < 0 ? local + SEGUNDOS_POR_DIA : local) / SEGUNDOS_POR_HORA;
}

function franjaDelMediodia(franjas: FranjaPronostico[], zonaHoraria: number) {
  return franjas.reduce((mejor, franja) =>
    Math.abs(horaLocal(franja.instante, zonaHoraria) - HORA_REPRESENTATIVA) <
    Math.abs(horaLocal(mejor.instante, zonaHoraria) - HORA_REPRESENTATIVA)
      ? franja
      : mejor,
  );
}

/**
 * Agrupa las franjas por día LOCAL de la ciudad (con su huso, no el del
 * usuario ni UTC) y arma los próximos días, sin contar hoy: mínima y máxima del
 * día, ícono de la franja más cercana al mediodía y la mayor probabilidad de
 * lluvia. La API manda 40 franjas (5 días desde ahora), así que además de los 5
 * días siguientes completos, el último puede venir parcial: se arma igual con las
 * franjas que haya, para que siempre sean 5 días. Un día parcial puede carecer de
 * franja de mediodía; entonces el ícono sale de la más cercana a esa hora.
 */
export function agruparPorDiaLocal(
  franjas: FranjaPronostico[],
  zonaHoraria: number,
  momento: number,
): DiaPronostico[] {
  const hoy = claveDiaLocal(momento, zonaHoraria);
  const porDia = new Map<string, FranjaPronostico[]>();
  for (const franja of franjas) {
    const clave = claveDiaLocal(franja.instante, zonaHoraria);
    if (clave <= hoy) continue;
    const delDia = porDia.get(clave);
    if (delDia) delDia.push(franja);
    else porDia.set(clave, [franja]);
  }

  const dias = [...porDia.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(0, DIAS_PRONOSTICO);

  return dias.map(([fecha, delDia]) => {
    const representativa = franjaDelMediodia(delDia, zonaHoraria);
    return {
      fecha,
      instante: representativa.instante,
      minima: Math.min(...delDia.map((f) => f.minima)),
      maxima: Math.max(...delDia.map((f) => f.maxima)),
      codigo: representativa.codigo,
      probabilidadLluvia: Math.max(...delDia.map((f) => f.probabilidadLluvia)),
    };
  });
}

export interface ResumenDeHoy {
  minima: number;
  maxima: number;
  /** De 0 a 100; null si no hay franjas para estimarla. */
  probabilidadLluvia: number | null;
}

interface DatosDeHoy {
  /** Temperatura actual, Celsius. */
  temperatura: number;
  /**
   * Respaldo para cuando no quedan franjas hoy: el rango entre estaciones que
   * informa el clima actual (temp_min y temp_max). No es la mín/máx del día,
   * pero sirve de cota razonable y siempre incluye la temperatura actual.
   */
  respaldo: { minima: number; maxima: number };
}

/**
 * Mínima, máxima y probabilidad de lluvia de HOY.
 *
 * - Mín/máx: las franjas que caen en el día local de la ciudad, junto con la
 *   temperatura actual. Las franjas ya pasadas del día no vienen en la API, así
 *   que a media tarde la mínima real (de la madrugada) puede ser menor.
 * - Si no quedan franjas hoy (de noche tarde), se usa el respaldo, siempre
 *   ampliado con la temperatura actual.
 * - Lluvia: el `pop` de la franja más cercana al momento, aunque ya sea de mañana.
 */
export function resumenDeHoy(
  franjas: FranjaPronostico[],
  zonaHoraria: number,
  momento: number,
  { temperatura, respaldo }: DatosDeHoy,
): ResumenDeHoy {
  const hoy = claveDiaLocal(momento, zonaHoraria);
  const deHoy = franjas.filter((f) => claveDiaLocal(f.instante, zonaHoraria) === hoy);

  const minimas = deHoy.length > 0 ? deHoy.map((f) => f.minima) : [respaldo.minima];
  const maximas = deHoy.length > 0 ? deHoy.map((f) => f.maxima) : [respaldo.maxima];

  const masCercana = franjas.reduce<FranjaPronostico | null>(
    (mejor, f) =>
      mejor === null || Math.abs(f.instante - momento) < Math.abs(mejor.instante - momento)
        ? f
        : mejor,
    null,
  );

  return {
    minima: Math.min(temperatura, ...minimas),
    maxima: Math.max(temperatura, ...maximas),
    probabilidadLluvia: masCercana ? masCercana.probabilidadLluvia : null,
  };
}

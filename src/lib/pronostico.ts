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
/** Un último día con menos franjas que estas está demasiado incompleto para mostrarlo. */
const FRANJAS_MINIMAS_ULTIMO_DIA = 3;
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
 * lluvia. La API cubre 5 días desde ahora, así que el último puede venir
 * incompleto: si tiene muy pocas franjas se descarta.
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

  const ultimo = dias.at(-1);
  if (ultimo && ultimo[1].length < FRANJAS_MINIMAS_ULTIMO_DIA) dias.pop();

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

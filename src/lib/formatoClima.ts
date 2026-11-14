import { convertirTemperatura, type Unidad } from "./unidades";

const PUNTOS_CARDINALES = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;
const NOMBRES_CARDINALES = [
  "norte",
  "noreste",
  "este",
  "sureste",
  "sur",
  "suroeste",
  "oeste",
  "noroeste",
] as const;
const SIGNO_MENOS = "−";

function capitalizar(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase("es") + texto.slice(1);
}

function sinPunto(texto: string): string {
  return texto.replace(/\.$/, "");
}

/** Fecha en el huso de la ciudad: se corre el instante y se formatea en UTC. */
function partesLocales(
  instante: number,
  zonaHoraria: number,
  opciones: Intl.DateTimeFormatOptions,
): Record<string, string> {
  const fecha = new Date((instante + zonaHoraria) * 1000);
  const partes = new Intl.DateTimeFormat("es", { ...opciones, timeZone: "UTC" })
    .formatToParts(fecha);
  return Object.fromEntries(partes.map(({ type, value }) => [type, value]));
}

/**
 * 24 → "24°", -12.4 → "−12°" (con signo menos tipográfico). Recibe grados
 * Celsius y convierte a la unidad pedida antes de redondear.
 */
export function formatearTemperatura(celsius: number, unidad: Unidad = "C"): string {
  const redondeado = Math.round(convertirTemperatura(celsius, unidad));
  if (redondeado < 0) return `${SIGNO_MENOS}${Math.abs(redondeado)}°`;
  return `${Math.abs(redondeado)}°`;
}

/** "15:42" en la hora local de la ciudad. */
export function formatearHoraLocal(instante: number, zonaHoraria: number): string {
  const { hour, minute } = partesLocales(instante, zonaHoraria, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${hour}:${minute}`;
}

/** "Sábado 14 de noviembre" (larga) o "Sáb 14 nov" (corta). */
export function formatearFechaLocal(
  instante: number,
  zonaHoraria: number,
  formato: "larga" | "corta",
): string {
  const largo = formato === "larga";
  const { weekday, day, month } = partesLocales(instante, zonaHoraria, {
    weekday: largo ? "long" : "short",
    day: "numeric",
    month: largo ? "long" : "short",
  });
  const dia = capitalizar(sinPunto(weekday));
  return largo ? `${dia} ${day} de ${month}` : `${dia} ${day} ${sinPunto(month)}`;
}

/**
 * "Dom 15" (con el número del día) o "Dom" (solo el día de la semana) para un
 * día del pronóstico, dado como fecha local de la ciudad («2026-11-15»). Una
 * fecha sin hora no cambia con el huso: se formatea tal cual.
 */
export function formatearDiaPronostico(fecha: string, conNumero: boolean): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const mediodia = Date.UTC(anio, mes - 1, dia, 12) / 1000;
  const partes = partesLocales(mediodia, 0, { weekday: "short", day: "numeric" });
  const semana = capitalizar(sinPunto(partes.weekday));
  return conNumero ? `${semana} ${partes.day}` : semana;
}

/** 0 → "N", 135 → "SE", 315 → "NO". */
export function puntoCardinal(grados: number): string {
  const normalizado = ((grados % 360) + 360) % 360;
  return PUNTOS_CARDINALES[Math.round(normalizado / 45) % PUNTOS_CARDINALES.length];
}

/** 14.2 → "14 km/h". */
export function formatearVelocidad(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

/** 135 → "del SE", 270 → "del O": de dónde viene el viento (los grados son meteorológicos). */
export function formatearOrigenViento(grados: number): string {
  return `del ${puntoCardinal(grados)}`;
}

/** Rotación en grados de una flecha que apunta hacia donde va el viento (opuesto a su origen). */
export function rotacionFlechaViento(grados: number): number {
  return (((grados + 180) % 360) + 360) % 360;
}

/** "Viento de 19 km/h del oeste" (o sin dirección), completo para lectores de pantalla. */
export function describirViento(kmh: number, grados: number | null): string {
  const velocidad = `Viento de ${formatearVelocidad(kmh)}`;
  if (grados === null) return velocidad;
  const normalizado = ((grados % 360) + 360) % 360;
  const nombre = NOMBRES_CARDINALES[Math.round(normalizado / 45) % NOMBRES_CARDINALES.length];
  return `${velocidad} del ${nombre}`;
}

export function formatearPorcentaje(porcentaje: number): string {
  return `${Math.round(porcentaje)} %`;
}

/** "AR" → "Argentina"; si Intl no lo conoce, devuelve el código. */
export function nombrePais(codigo: string): string {
  try {
    const nombres = new Intl.DisplayNames(["es"], { type: "region", fallback: "code" });
    return nombres.of(codigo.toUpperCase()) ?? codigo;
  } catch {
    return codigo;
  }
}

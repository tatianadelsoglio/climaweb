import { convertirTemperatura, type Unidad } from "./unidades.ts";

const PUNTOS_CARDINALES = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;
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

/** "Dom 15" (con el número del día) o "Dom" (solo el día de la semana), en el huso de la ciudad. */
export function formatearDiaPronostico(
  instante: number,
  zonaHoraria: number,
  conNumero: boolean,
): string {
  const { weekday, day } = partesLocales(instante, zonaHoraria, {
    weekday: "short",
    day: "numeric",
  });
  const dia = capitalizar(sinPunto(weekday));
  return conNumero ? `${dia} ${day}` : dia;
}

/** 0 → "N", 135 → "SE", 315 → "NO". */
export function puntoCardinal(grados: number): string {
  const normalizado = ((grados % 360) + 360) % 360;
  return PUNTOS_CARDINALES[Math.round(normalizado / 45) % PUNTOS_CARDINALES.length];
}

/** "14 km/h SE" o "14 km/h" si no hay dirección. */
export function formatearViento(kmh: number, direccion: number | null): string {
  const velocidad = `${Math.round(kmh)} km/h`;
  return direccion === null ? velocidad : `${velocidad} ${puntoCardinal(direccion)}`;
}

export function formatearHumedad(porcentaje: number): string {
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

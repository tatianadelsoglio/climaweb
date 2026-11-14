import { condicionDeWmo } from "./codigoWmo";
import type { DiaPronostico } from "../types/clima";

export const DIAS_PRONOSTICO = 7;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function esNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function columna(daily: Record<string, unknown>, nombre: string): unknown[] | null {
  const valores = daily[nombre];
  return Array.isArray(valores) ? (valores as unknown[]) : null;
}

/**
 * Respuesta de /v1/forecast (daily, timezone=auto) → días del pronóstico, con
 * hoy primero. Open-Meteo devuelve columnas paralelas; se arma un día por
 * posición y se descarta el que tenga fecha, temperaturas o código inválidos
 * (los valores pueden venir null). La probabilidad de lluvia es opcional.
 */
export function normalizarPronostico(datos: unknown): DiaPronostico[] {
  if (!esObjeto(datos) || !esObjeto(datos.daily)) return [];
  const { daily } = datos;
  const fechas = columna(daily, "time");
  const maximas = columna(daily, "temperature_2m_max");
  const minimas = columna(daily, "temperature_2m_min");
  const codigos = columna(daily, "weather_code");
  const lluvia = columna(daily, "precipitation_probability_max");
  if (!fechas || !maximas || !minimas || !codigos) return [];

  const dias: DiaPronostico[] = [];
  for (let i = 0; i < fechas.length && dias.length < DIAS_PRONOSTICO; i++) {
    const fecha = fechas[i];
    const maxima = maximas[i];
    const minima = minimas[i];
    const wmo = codigos[i];
    const probabilidad = lluvia?.[i];
    const codigo = esNumero(wmo) ? condicionDeWmo(wmo) : null;
    if (
      typeof fecha !== "string" ||
      !FECHA.test(fecha) ||
      !esNumero(maxima) ||
      !esNumero(minima) ||
      codigo === null
    ) {
      continue;
    }
    dias.push({
      fecha,
      minima,
      maxima,
      codigo,
      probabilidadLluvia: esNumero(probabilidad)
        ? Math.round(Math.min(Math.max(probabilidad, 0), 100))
        : null,
    });
  }
  return dias;
}

/** Valida en el cliente la respuesta de /api/forecast. */
export function esRespuestaPronostico(datos: unknown): datos is { dias: DiaPronostico[] } {
  if (!esObjeto(datos) || !Array.isArray(datos.dias) || datos.dias.length === 0) return false;
  return (datos.dias as unknown[]).every(
    (dia) =>
      esObjeto(dia) &&
      typeof dia.fecha === "string" &&
      FECHA.test(dia.fecha) &&
      esNumero(dia.minima) &&
      esNumero(dia.maxima) &&
      esNumero(dia.codigo) &&
      (dia.probabilidadLluvia === null || esNumero(dia.probabilidadLluvia)),
  );
}

import type { BusquedaValida } from "@/lib/validarBusqueda";
import type { ClimaActual, CodigoError } from "@/types/clima";

const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const TIMEOUT_MS = 8000;
const MS_A_KMH = 3.6;

export class OpenWeatherError extends Error {
  constructor(
    readonly codigo: CodigoError,
    readonly status: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "OpenWeatherError";
  }
}

interface OpenWeatherRespuesta {
  name: string;
  timezone: number;
  sys: { country: string; sunrise?: unknown; sunset?: unknown };
  main: {
    temp: number;
    temp_max: number;
    temp_min: number;
    feels_like: number;
    humidity: number;
  };
  wind: { speed: number; deg?: unknown };
  weather: [{ id: number }, ...unknown[]];
}

function esNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function esCondicionValida(valor: unknown): boolean {
  if (!Array.isArray(valor) || valor.length === 0) return false;
  const [condicion]: unknown[] = valor;
  return esObjeto(condicion) && esNumero(condicion.id);
}

function esRespuestaValida(datos: unknown): datos is OpenWeatherRespuesta {
  if (
    !esObjeto(datos) ||
    !esObjeto(datos.main) ||
    !esObjeto(datos.sys) ||
    !esObjeto(datos.wind)
  ) {
    return false;
  }
  return (
    typeof datos.name === "string" &&
    typeof datos.sys.country === "string" &&
    esNumero(datos.timezone) &&
    esNumero(datos.main.temp) &&
    esNumero(datos.main.temp_max) &&
    esNumero(datos.main.temp_min) &&
    esNumero(datos.main.feels_like) &&
    esNumero(datos.main.humidity) &&
    esNumero(datos.wind.speed) &&
    esCondicionValida(datos.weather)
  );
}

/** OpenWeather omite (o manda 0) amanecer y atardecer durante el día o la noche polar. */
function instanteOpcional(valor: unknown): number | null {
  return esNumero(valor) && valor > 0 ? valor : null;
}

function errorDeEstado(status: number): OpenWeatherError {
  switch (status) {
    case 404:
      return new OpenWeatherError(
        "CIUDAD_NO_ENCONTRADA",
        404,
        "No se encontró la ciudad indicada.",
      );
    case 401:
      // La API key es nuestra: para el cliente es un fallo del servidor, no de autenticación.
      return new OpenWeatherError(
        "SERVICIO_NO_CONFIGURADO",
        502,
        "El servicio del clima no está configurado correctamente.",
      );
    case 429:
      return new OpenWeatherError(
        "LIMITE_DE_CONSULTAS",
        429,
        "Se superó el límite de consultas. Probá de nuevo en unos minutos.",
      );
    default:
      return new OpenWeatherError(
        "SERVICIO_NO_DISPONIBLE",
        502,
        "El servicio del clima no está disponible por el momento.",
      );
  }
}

export async function obtenerClima(
  { ciudad, pais }: BusquedaValida,
  apiKey: string,
): Promise<ClimaActual> {
  const url = new URL(OPENWEATHER_URL);
  url.searchParams.set("q", pais ? `${ciudad},${pais}` : ciudad);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "es");
  url.searchParams.set("appid", apiKey);

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new OpenWeatherError(
        "SERVICIO_NO_DISPONIBLE",
        504,
        "El servicio del clima tardó demasiado en responder.",
      );
    }
    throw new OpenWeatherError(
      "SERVICIO_NO_DISPONIBLE",
      502,
      "No se pudo conectar con el servicio del clima.",
    );
  }

  if (!respuesta.ok) {
    throw errorDeEstado(respuesta.status);
  }

  let datos: unknown;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!esRespuestaValida(datos)) {
    throw new OpenWeatherError(
      "RESPUESTA_INVALIDA",
      502,
      "El servicio del clima devolvió una respuesta inesperada.",
    );
  }

  const [condicion] = datos.weather;
  return {
    ciudad: datos.name,
    pais: datos.sys.country,
    temperatura: datos.main.temp,
    temperaturaMaxima: datos.main.temp_max,
    temperaturaMinima: datos.main.temp_min,
    sensacionTermica: datos.main.feels_like,
    humedad: datos.main.humidity,
    viento: {
      velocidad: datos.wind.speed * MS_A_KMH,
      direccion: esNumero(datos.wind.deg) ? datos.wind.deg : null,
    },
    condicion: { codigo: condicion.id },
    amanecer: instanteOpcional(datos.sys.sunrise),
    atardecer: instanteOpcional(datos.sys.sunset),
    zonaHoraria: datos.timezone,
    momento: Math.floor(Date.now() / 1000),
  };
}

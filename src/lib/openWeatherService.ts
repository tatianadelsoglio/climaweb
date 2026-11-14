import type { ClimaActual, CodigoError } from "@/types/clima";

const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const TIMEOUT_MS = 8000;

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
  sys: { country: string };
  main: { temp: number; temp_max: number; temp_min: number };
}

function esNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function esRespuestaValida(datos: unknown): datos is OpenWeatherRespuesta {
  if (!esObjeto(datos) || !esObjeto(datos.main) || !esObjeto(datos.sys)) {
    return false;
  }
  return (
    typeof datos.name === "string" &&
    typeof datos.sys.country === "string" &&
    esNumero(datos.main.temp) &&
    esNumero(datos.main.temp_max) &&
    esNumero(datos.main.temp_min)
  );
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
  ciudad: string,
  pais: string,
  apiKey: string,
): Promise<ClimaActual> {
  const url = new URL(OPENWEATHER_URL);
  url.searchParams.set("q", `${ciudad},${pais}`);
  url.searchParams.set("units", "metric");
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

  return {
    ciudad: datos.name,
    pais: datos.sys.country,
    temperatura: datos.main.temp,
    temperaturaMaxima: datos.main.temp_max,
    temperaturaMinima: datos.main.temp_min,
  };
}

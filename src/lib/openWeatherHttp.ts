import type { CodigoError } from "@/types/clima";

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

/** GET a OpenWeather con timeout; devuelve el JSON o lanza OpenWeatherError. */
export async function pedirJson(
  url: URL,
  opciones: Pick<RequestInit, "cache"> & { next?: { revalidate: number } } = {
    cache: "no-store",
  },
): Promise<unknown> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      ...opciones,
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

  try {
    return await respuesta.json();
  } catch {
    throw new OpenWeatherError(
      "RESPUESTA_INVALIDA",
      502,
      "El servicio del clima devolvió una respuesta inesperada.",
    );
  }
}

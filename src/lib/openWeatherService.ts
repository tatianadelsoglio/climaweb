import { OpenWeatherError, pedirJson } from "@/lib/openWeatherHttp";
import {
  agruparPorDiaLocal,
  extraerFranjas,
  type FranjaPronostico,
} from "@/lib/pronostico";
import type { BusquedaValida } from "@/lib/validarBusqueda";
import type { ClimaActual } from "@/types/clima";

const URL_CLIMA = "https://api.openweathermap.org/data/2.5/weather";
const URL_PRONOSTICO = "https://api.openweathermap.org/data/2.5/forecast";
const MS_A_KMH = 3.6;

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

async function pedirClima(url: URL): Promise<OpenWeatherRespuesta> {
  const datos = await pedirJson(url);
  if (!esRespuestaValida(datos)) {
    throw new OpenWeatherError(
      "RESPUESTA_INVALIDA",
      502,
      "El servicio del clima devolvió una respuesta inesperada.",
    );
  }
  return datos;
}

/** El pronóstico es accesorio: si falla, el clima actual se muestra igual. */
async function pedirFranjas(url: URL): Promise<FranjaPronostico[] | null> {
  try {
    return extraerFranjas(await pedirJson(url));
  } catch (error) {
    console.error("No se pudo obtener el pronóstico", error);
    return null;
  }
}

function urlDe(base: string, { ciudad, pais }: BusquedaValida, apiKey: string): URL {
  const url = new URL(base);
  url.searchParams.set("q", pais ? `${ciudad},${pais}` : ciudad);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "es");
  url.searchParams.set("appid", apiKey);
  return url;
}

export async function obtenerClima(
  busqueda: BusquedaValida,
  apiKey: string,
): Promise<ClimaActual> {
  const [datos, franjas] = await Promise.all([
    pedirClima(urlDe(URL_CLIMA, busqueda, apiKey)),
    pedirFranjas(urlDe(URL_PRONOSTICO, busqueda, apiKey)),
  ]);

  const [condicion] = datos.weather;
  const momento = Math.floor(Date.now() / 1000);
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
    momento,
    pronostico: franjas ? agruparPorDiaLocal(franjas, datos.timezone, momento) : null,
  };
}

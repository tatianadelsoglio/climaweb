import { TTL, normalizarTexto, opcionesDeCache } from "@/lib/cacheProveedores";
import { formatearCoordenada } from "@/lib/coordenadas";
import { ProveedorError, pedirJson } from "@/lib/proveedorHttp";
import type { BusquedaValida, CoordenadasValidas } from "@/lib/validarBusqueda";
import type { ClimaActual } from "@/types/clima";

const URL_CLIMA = "https://api.openweathermap.org/data/2.5/weather";
const MS_A_KMH = 3.6;

interface OpenWeatherRespuesta {
  name: string;
  timezone: number;
  sys: { country: string; sunrise?: unknown; sunset?: unknown };
  coord: { lat: number; lon: number };
  main: {
    temp: number;
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
    !esObjeto(datos.coord) ||
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
    esNumero(datos.coord.lat) &&
    esNumero(datos.coord.lon) &&
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
  const datos = await pedirJson(url, opcionesDeCache(TTL.clima));
  if (!esRespuestaValida(datos)) {
    throw new ProveedorError(
      "RESPUESTA_INVALIDA",
      502,
      "El servicio del clima devolvió una respuesta inesperada.",
    );
  }
  return datos;
}

export type UbicacionClima = BusquedaValida | CoordenadasValidas;

function urlDe(ubicacion: UbicacionClima, apiKey: string): URL {
  const url = new URL(URL_CLIMA);
  if ("lat" in ubicacion) {
    url.searchParams.set("lat", formatearCoordenada(ubicacion.lat));
    url.searchParams.set("lon", formatearCoordenada(ubicacion.lon));
  } else {
    const { ciudad, pais } = ubicacion;
    // Texto normalizado: «Nueva  York» y «nueva york» comparten entrada de caché.
    const q = normalizarTexto(ciudad);
    url.searchParams.set("q", pais ? `${q},${pais.toUpperCase()}` : q);
  }
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "es");
  url.searchParams.set("appid", apiKey);
  return url;
}

export async function obtenerClima(
  ubicacion: UbicacionClima,
  apiKey: string,
): Promise<ClimaActual> {
  const datos = await pedirClima(urlDe(ubicacion, apiKey));
  const [condicion] = datos.weather;
  return {
    ciudad: datos.name,
    pais: datos.sys.country,
    temperatura: datos.main.temp,
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
    coordenadas: { lat: datos.coord.lat, lon: datos.coord.lon },
  };
}

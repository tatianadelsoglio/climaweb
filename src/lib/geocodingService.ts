import { normalizarGeocoding } from "@/lib/geocoding";
import { pedirJson } from "@/lib/proveedorHttp";
import type { BusquedaValida } from "@/lib/validarBusqueda";
import type { Sugerencia } from "@/types/geocoding";

const URL_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search";
// Se piden de más porque la normalización descarta los repetidos y recorta a 5.
const RESULTADOS_PEDIDOS = 10;
// Los lugares casi no cambian: se cachea para no repetir pedidos al proveedor.
const REVALIDAR_SEGUNDOS = 86_400;

/**
 * Hasta 5 lugares que coinciden con lo escrito (con language=es, ya en español),
 * acotados al país si se indicó. Open-Meteo no pide API key. Con 3 o más letras
 * acepta coincidencias parciales («Córd» devuelve los Córdoba); con menos solo
 * hay coincidencia exacta, por eso el autocompletado exige 3.
 */
export async function buscarSugerencias({ ciudad, pais }: BusquedaValida): Promise<Sugerencia[]> {
  const url = new URL(URL_GEOCODING);
  url.searchParams.set("name", ciudad);
  if (pais) url.searchParams.set("countryCode", pais);
  url.searchParams.set("count", String(RESULTADOS_PEDIDOS));
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");

  return normalizarGeocoding(await pedirJson(url, { next: { revalidate: REVALIDAR_SEGUNDOS } }));
}

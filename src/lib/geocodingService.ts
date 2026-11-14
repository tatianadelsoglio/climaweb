import { LIMITE_SUGERENCIAS, normalizarGeocoding } from "@/lib/geocoding";
import { pedirJson } from "@/lib/openWeatherHttp";
import type { BusquedaValida } from "@/lib/validarBusqueda";
import type { Sugerencia } from "@/types/geocoding";

const URL_GEOCODING = "https://api.openweathermap.org/geo/1.0/direct";
// Los lugares casi no cambian: se cachea para cuidar la cuota de la API key.
const REVALIDAR_SEGUNDOS = 86_400;

/** Hasta 5 lugares que coinciden con la ciudad (y el país, si se indicó). */
export async function buscarSugerencias(
  { ciudad, pais }: BusquedaValida,
  apiKey: string,
): Promise<Sugerencia[]> {
  const url = new URL(URL_GEOCODING);
  url.searchParams.set("q", pais ? `${ciudad},${pais}` : ciudad);
  // Se piden de más porque la normalización descarta los repetidos.
  url.searchParams.set("limit", String(LIMITE_SUGERENCIAS));
  url.searchParams.set("appid", apiKey);

  return normalizarGeocoding(
    await pedirJson(url, { next: { revalidate: REVALIDAR_SEGUNDOS } }),
  );
}

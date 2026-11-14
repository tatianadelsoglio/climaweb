import { formatearCoordenada } from "@/lib/coordenadas";
import { OpenWeatherError, pedirJson } from "@/lib/openWeatherHttp";
import { normalizarPronostico } from "@/lib/openMeteo";
import type { CoordenadasValidas } from "@/lib/validarBusqueda";
import type { DiaPronostico } from "@/types/clima";

const URL_PRONOSTICO = "https://api.open-meteo.com/v1/forecast";
// El pronóstico diario cambia pocas veces por hora.
const REVALIDAR_SEGUNDOS = 900;

/** Hoy y los 6 días siguientes de una ubicación, con el huso de la propia ubicación. */
export async function obtenerPronostico({ lat, lon }: CoordenadasValidas): Promise<DiaPronostico[]> {
  const url = new URL(URL_PRONOSTICO);
  url.searchParams.set("latitude", formatearCoordenada(lat));
  url.searchParams.set("longitude", formatearCoordenada(lon));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const dias = normalizarPronostico(
    await pedirJson(url, { next: { revalidate: REVALIDAR_SEGUNDOS } }),
  );
  if (dias.length === 0) {
    throw new OpenWeatherError(
      "RESPUESTA_INVALIDA",
      502,
      "El servicio del pronóstico devolvió una respuesta inesperada.",
    );
  }
  return dias;
}

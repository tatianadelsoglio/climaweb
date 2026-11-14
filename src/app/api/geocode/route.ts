import { NextResponse, type NextRequest } from "next/server";
import { MINIMO_CARACTERES } from "@/lib/geocoding";
import { buscarSugerencias } from "@/lib/geocodingService";
import { OpenWeatherError } from "@/lib/openWeatherHttp";
import { validarBusqueda } from "@/lib/validarBusqueda";
import type { CodigoError, ErrorApi } from "@/types/clima";
import type { RespuestaGeocoding } from "@/types/geocoding";

function respuestaError(
  codigo: CodigoError,
  mensaje: string,
  status: number,
): NextResponse<ErrorApi> {
  return NextResponse.json({ error: { codigo, mensaje } }, { status });
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<RespuestaGeocoding | ErrorApi>> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error("Falta la variable de entorno OPENWEATHER_API_KEY");
    return respuestaError(
      "SERVICIO_NO_CONFIGURADO",
      "El servicio de búsqueda no está configurado correctamente.",
      500,
    );
  }

  const { searchParams } = request.nextUrl;
  const validacion = validarBusqueda(searchParams.get("ciudad"), searchParams.get("pais"));
  if (!validacion.valida) {
    return respuestaError("PARAMETROS_INVALIDOS", validacion.mensaje, 400);
  }
  if (validacion.datos.ciudad.length < MINIMO_CARACTERES) {
    return respuestaError(
      "PARAMETROS_INVALIDOS",
      `El parámetro ciudad necesita al menos ${MINIMO_CARACTERES} caracteres.`,
      400,
    );
  }

  try {
    const sugerencias = await buscarSugerencias(validacion.datos, apiKey);
    return NextResponse.json(
      { sugerencias },
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
    );
  } catch (error) {
    if (error instanceof OpenWeatherError) {
      if (error.codigo === "SERVICIO_NO_CONFIGURADO") {
        console.error("OpenWeather rechazó la API key (401)");
      }
      // Una búsqueda sin resultados no es un error: se responde una lista vacía.
      if (error.codigo === "CIUDAD_NO_ENCONTRADA") {
        return NextResponse.json({ sugerencias: [] });
      }
      return respuestaError(error.codigo, error.message, error.status);
    }
    console.error("Error inesperado al buscar sugerencias", error);
    return respuestaError("SERVICIO_NO_DISPONIBLE", "Ocurrió un error inesperado.", 500);
  }
}

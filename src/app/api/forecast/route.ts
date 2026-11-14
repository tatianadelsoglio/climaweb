import { NextResponse, type NextRequest } from "next/server";
import { obtenerPronostico } from "@/lib/openMeteoService";
import { OpenWeatherError } from "@/lib/openWeatherHttp";
import { validarCoordenadas } from "@/lib/validarBusqueda";
import type { CodigoError, ErrorApi, RespuestaPronostico } from "@/types/clima";

function respuestaError(
  codigo: CodigoError,
  mensaje: string,
  status: number,
): NextResponse<ErrorApi> {
  return NextResponse.json({ error: { codigo, mensaje } }, { status });
}

/** Pronóstico diario (Open-Meteo, sin API key) por coordenadas: ?lat=..&lon=.. */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<RespuestaPronostico | ErrorApi>> {
  const { searchParams } = request.nextUrl;
  const validacion = validarCoordenadas(searchParams.get("lat"), searchParams.get("lon"));
  if (!validacion.valida) {
    return respuestaError("PARAMETROS_INVALIDOS", validacion.mensaje, 400);
  }

  try {
    const dias = await obtenerPronostico(validacion.datos);
    return NextResponse.json(
      { dias },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=900" } },
    );
  } catch (error) {
    if (error instanceof OpenWeatherError) {
      return respuestaError(error.codigo, error.message, error.status);
    }
    console.error("Error inesperado al obtener el pronóstico", error);
    return respuestaError("SERVICIO_NO_DISPONIBLE", "Ocurrió un error inesperado.", 500);
  }
}

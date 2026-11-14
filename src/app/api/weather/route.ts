import { NextResponse, type NextRequest } from "next/server";
import { OpenWeatherError } from "@/lib/openWeatherHttp";
import { obtenerClima } from "@/lib/openWeatherService";
import { validarBusqueda } from "@/lib/validarBusqueda";
import type { CodigoError, ErrorApi, RespuestaClima } from "@/types/clima";

function respuestaError(
  codigo: CodigoError,
  mensaje: string,
  status: number,
): NextResponse<ErrorApi> {
  return NextResponse.json({ error: { codigo, mensaje } }, { status });
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<RespuestaClima>> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error("Falta la variable de entorno OPENWEATHER_API_KEY");
    return respuestaError(
      "SERVICIO_NO_CONFIGURADO",
      "El servicio del clima no está configurado correctamente.",
      500,
    );
  }

  const { searchParams } = request.nextUrl;
  const validacion = validarBusqueda(
    searchParams.get("ciudad"),
    searchParams.get("pais"),
  );
  if (!validacion.valida) {
    return respuestaError("PARAMETROS_INVALIDOS", validacion.mensaje, 400);
  }

  try {
    const clima = await obtenerClima(validacion.datos, apiKey);
    return NextResponse.json(clima);
  } catch (error) {
    if (error instanceof OpenWeatherError) {
      if (error.codigo === "SERVICIO_NO_CONFIGURADO") {
        console.error("OpenWeather rechazó la API key (401)");
      }
      return respuestaError(error.codigo, error.message, error.status);
    }
    console.error("Error inesperado al consultar el clima", error);
    return respuestaError(
      "SERVICIO_NO_DISPONIBLE",
      "Ocurrió un error inesperado.",
      500,
    );
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { TTL, cabeceraCacheCdn } from "@/lib/cacheProveedores";
import { limitarPorIp } from "@/lib/limitarPeticiones";
import { ProveedorError } from "@/lib/proveedorHttp";
import { obtenerClima } from "@/lib/openWeatherService";
import { validarBusqueda, validarCoordenadas } from "@/lib/validarBusqueda";
import type { CodigoError, ErrorApi, RespuestaClima } from "@/types/clima";

function respuestaError(
  codigo: CodigoError,
  mensaje: string,
  status: number,
): NextResponse<ErrorApi> {
  // Los errores nunca se cachean (ni en el CDN ni en el navegador).
  return NextResponse.json(
    { error: { codigo, mensaje } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<RespuestaClima | ErrorApi>> {
  // Primero el límite por IP (mejor esfuerzo, por instancia): ver rateLimit.ts.
  const limitada = await limitarPorIp(request, "weather");
  if (limitada) return limitada;

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
  // Con lat o lon se consulta por coordenadas (autocompletado, geolocalización); si no, por ciudad.
  const porCoordenadas = searchParams.has("lat") || searchParams.has("lon");
  const validacion = porCoordenadas
    ? validarCoordenadas(searchParams.get("lat"), searchParams.get("lon"))
    : validarBusqueda(searchParams.get("ciudad"), searchParams.get("pais"));
  if (!validacion.valida) {
    return respuestaError("PARAMETROS_INVALIDOS", validacion.mensaje, 400);
  }

  try {
    const clima = await obtenerClima(validacion.datos, apiKey);
    return NextResponse.json(clima, {
      headers: { "Cache-Control": cabeceraCacheCdn(TTL.clima) },
    });
  } catch (error) {
    if (error instanceof ProveedorError) {
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

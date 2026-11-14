import { NextResponse, type NextRequest } from "next/server";
import { TTL, cabeceraCacheCdn } from "@/lib/cacheProveedores";
import { MINIMO_CARACTERES } from "@/lib/geocoding";
import { buscarSugerencias } from "@/lib/geocodingService";
import { limitarPorIp } from "@/lib/limitarPeticiones";
import { ProveedorError } from "@/lib/proveedorHttp";
import { validarBusqueda } from "@/lib/validarBusqueda";
import type { CodigoError, ErrorApi } from "@/types/clima";
import type { RespuestaGeocoding } from "@/types/geocoding";

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
): Promise<NextResponse<RespuestaGeocoding | ErrorApi>> {
  // Primero el límite por IP (mejor esfuerzo, por instancia): ver rateLimit.ts.
  const limitada = await limitarPorIp(request, "geocode");
  if (limitada) return limitada;

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
    const sugerencias = await buscarSugerencias(validacion.datos);
    return NextResponse.json(
      { sugerencias },
      { headers: { "Cache-Control": cabeceraCacheCdn(TTL.geocoding) } },
    );
  } catch (error) {
    if (error instanceof ProveedorError) {
      return respuestaError(error.codigo, error.message, error.status);
    }
    console.error("Error inesperado al buscar sugerencias", error);
    return respuestaError("SERVICIO_NO_DISPONIBLE", "Ocurrió un error inesperado.", 500);
  }
}

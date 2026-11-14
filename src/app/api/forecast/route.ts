import { NextResponse, type NextRequest } from "next/server";
import { TTL, cabeceraCacheCdn } from "@/lib/cacheProveedores";
import { obtenerPronostico } from "@/lib/openMeteoService";
import { limitarPorIp } from "@/lib/limitarPeticiones";
import { ProveedorError } from "@/lib/proveedorHttp";
import { validarCoordenadas } from "@/lib/validarBusqueda";
import type { CodigoError, ErrorApi, RespuestaPronostico } from "@/types/clima";

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

/** Pronóstico diario (Open-Meteo, sin API key) por coordenadas: ?lat=..&lon=.. */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<RespuestaPronostico | ErrorApi>> {
  // Primero el límite por IP (mejor esfuerzo, por instancia): ver rateLimit.ts.
  const limitada = await limitarPorIp(request, "forecast");
  if (limitada) return limitada;

  const { searchParams } = request.nextUrl;
  const validacion = validarCoordenadas(searchParams.get("lat"), searchParams.get("lon"));
  if (!validacion.valida) {
    return respuestaError("PARAMETROS_INVALIDOS", validacion.mensaje, 400);
  }

  try {
    const dias = await obtenerPronostico(validacion.datos);
    return NextResponse.json(
      { dias },
      { headers: { "Cache-Control": cabeceraCacheCdn(TTL.pronostico) } },
    );
  } catch (error) {
    if (error instanceof ProveedorError) {
      return respuestaError(error.codigo, error.message, error.status);
    }
    console.error("Error inesperado al obtener el pronóstico", error);
    return respuestaError("SERVICIO_NO_DISPONIBLE", "Ocurrió un error inesperado.", 500);
  }
}

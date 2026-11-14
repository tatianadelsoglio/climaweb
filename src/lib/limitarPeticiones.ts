import { NextResponse } from "next/server";
import { almacenLimite } from "@/lib/almacenLimite";
import type { AlmacenLimite, ConfigLimite } from "@/lib/rateLimit";
import type { ErrorApi } from "@/types/clima";

export type RutaLimitada = "weather" | "forecast" | "geocode";

/**
 * Límites por IP. El autocompletado admite más: pide una vez por pausa al escribir.
 * Con el ritmo sostenido de abajo, una persona normal no los alcanza.
 */
export const LIMITES: Readonly<Record<RutaLimitada, ConfigLimite>> = {
  weather: { capacidad: 30, fichasPorSegundo: 0.5 }, // ráfaga de 30; 30 por minuto
  forecast: { capacidad: 30, fichasPorSegundo: 0.5 },
  geocode: { capacidad: 60, fichasPorSegundo: 2 }, // ráfaga de 60; 120 por minuto
};

const IP_DESCONOCIDA = "desconocida";

/**
 * IP del cliente. Detrás de Vercel (o de cualquier proxy de confianza)
 * `x-forwarded-for` la fija la plataforma: se toma el primer valor. Sin esos
 * encabezados (por ejemplo, en desarrollo) todos comparten una clave.
 */
export function ipDelCliente(headers: Headers): string {
  const reenviada = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || headers.get("x-real-ip")?.trim() || IP_DESCONOCIDA;
}

/**
 * Aplica el límite de la ruta. Devuelve la respuesta 429 (con `Retry-After`) si la IP
 * se pasó, o null para seguir. `almacen` y `ahoraMs` se inyectan solo en pruebas.
 */
export async function limitarPorIp(
  request: Request,
  ruta: RutaLimitada,
  almacen: AlmacenLimite = almacenLimite,
  ahoraMs: number = Date.now(),
): Promise<NextResponse<ErrorApi> | null> {
  const clave = `${ruta}:${ipDelCliente(request.headers)}`;
  const resultado = await almacen.consumir(clave, LIMITES[ruta], ahoraMs);
  if (resultado.permitido) return null;

  return NextResponse.json(
    {
      error: {
        codigo: "LIMITE_DE_CONSULTAS",
        mensaje: `Hiciste demasiadas consultas seguidas. Probá de nuevo en ${resultado.reintentarEnSegundos} segundos.`,
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(resultado.reintentarEnSegundos),
        "Cache-Control": "no-store",
      },
    },
  );
}

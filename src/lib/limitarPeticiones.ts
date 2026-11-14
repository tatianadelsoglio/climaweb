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

/**
 * IP del cliente, o null si no se puede saber.
 *
 * La IP se toma de las cabeceras que pone Vercel: `x-forwarded-for` (primer valor) y,
 * si no está, `x-real-ip`. Vercel las fija la propia plataforma y el cliente no puede
 * falsearlas. EN OTRO HOSTING HAY QUE REVISAR EL PROXY: si no reescribe esas cabeceras,
 * cualquiera puede mandar un `x-forwarded-for` inventado y esquivar el límite rotándolo.
 *
 * Sin ninguna de las dos (por ejemplo, `next dev` o `next start` sin proxy) no hay forma
 * confiable de distinguir clientes: compartir un cubo «desconocida» dejaría a todos
 * limitados por lo que haga uno solo. En ese caso NO se limita; la caché de los
 * proveedores (cacheProveedores.ts) sigue protegiendo la cuota.
 */
export function ipDelCliente(headers: Headers): string | null {
  const reenviada = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || headers.get("x-real-ip")?.trim() || null;
}

/**
 * Aplica el límite de la ruta. Devuelve la respuesta 429 (con `Retry-After`) si la IP
 * se pasó, o null para seguir (también si no hay IP conocida: ver `ipDelCliente`).
 * `almacen` y `ahoraMs` se inyectan solo en pruebas.
 */
export async function limitarPorIp(
  request: Request,
  ruta: RutaLimitada,
  almacen: AlmacenLimite = almacenLimite,
  ahoraMs: number = Date.now(),
): Promise<NextResponse<ErrorApi> | null> {
  const ip = ipDelCliente(request.headers);
  if (ip === null) return null;

  const clave = `${ruta}:${ip}`;
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

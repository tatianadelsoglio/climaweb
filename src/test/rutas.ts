import { NextRequest } from "next/server";
import { vi } from "vitest";

/** Respuesta del proveedor simulada. */
export function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Respuesta cuyo cuerpo no es JSON. */
export function respuestaMalformada(status = 200): Response {
  return new Response("<html>no soy json</html>", { status });
}

/** Reemplaza fetch por un simulacro que devuelve (o rechaza con) lo indicado, en orden. */
export function simularFetch(...resultados: Array<Response | Error>) {
  const simulacro = vi.fn(async () => {
    const siguiente = resultados.length > 1 ? resultados.shift() : resultados[0];
    if (siguiente instanceof Error) throw siguiente;
    // Cada llamada necesita su propia copia: un cuerpo solo se lee una vez.
    return (siguiente as Response).clone();
  });
  vi.stubGlobal("fetch", simulacro);
  return simulacro;
}

/** Error que lanza fetch cuando vence AbortSignal.timeout. */
export function errorDeTimeout(): DOMException {
  return new DOMException("The operation was aborted due to timeout", "TimeoutError");
}

/** Pedido a una ruta de /api con parámetros y, opcionalmente, IP de origen. */
export function pedidoApi(
  ruta: string,
  parametros: Record<string, string> = {},
  ip = "203.0.113.10",
): NextRequest {
  const url = new URL(`http://localhost${ruta}`);
  for (const [clave, valor] of Object.entries(parametros)) url.searchParams.set(clave, valor);
  return new NextRequest(url, { headers: { "x-forwarded-for": ip } });
}

/** URL que recibió fetch en la llamada `n` (0 = la primera). */
export function urlLlamada(simulacro: ReturnType<typeof simularFetch>, n = 0): URL {
  const [url] = simulacro.mock.calls[n] as unknown as [URL];
  return new URL(String(url));
}

/** Opciones que recibió fetch en la llamada `n`. */
export function opcionesLlamada(simulacro: ReturnType<typeof simularFetch>, n = 0) {
  const [, opciones] = simulacro.mock.calls[n] as unknown as [
    unknown,
    { next?: { revalidate?: number }; cache?: string } | undefined,
  ];
  return opciones ?? {};
}

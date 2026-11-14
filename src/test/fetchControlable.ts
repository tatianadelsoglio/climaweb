import { vi } from "vitest";

export interface PedidoPendiente {
  url: string;
  signal: AbortSignal | undefined;
  resolver: (respuesta: Response) => void;
  rechazar: (error: unknown) => void;
}

/**
 * fetch simulado cuyas respuestas se resuelven a mano y en el orden que se quiera,
 * para probar cancelaciones y carreras. Con `respetarAbort` (por defecto) se
 * comporta como el real: al abortar la señal, el pedido se rechaza con AbortError.
 * Con `respetarAbort: false` ignora la señal, para comprobar que el código también
 * descarta respuestas viejas que llegan igual.
 */
export function fetchControlable({ respetarAbort = true }: { respetarAbort?: boolean } = {}) {
  const pendientes: PedidoPendiente[] = [];

  const simulacro = vi.fn(
    (entrada: unknown, init?: { signal?: AbortSignal }) =>
      new Promise<Response>((resolve, reject) => {
        const signal = init?.signal;
        pendientes.push({
          url: String(entrada),
          signal,
          resolver: resolve,
          rechazar: reject,
        });
        if (respetarAbort && signal) {
          const abortar = () => reject(new DOMException("The operation was aborted.", "AbortError"));
          if (signal.aborted) abortar();
          else signal.addEventListener("abort", abortar);
        }
      }),
  );
  vi.stubGlobal("fetch", simulacro);

  return { simulacro, pendientes };
}

"use client";

import { useEffect, useState } from "react";
import { formatearCoordenada } from "@/lib/coordenadas";
import { esRespuestaPronostico } from "@/lib/openMeteo";
import type { ClimaActual, DiaPronostico } from "@/types/clima";

export type EstadoPronostico =
  | { estado: "cargando" }
  | { estado: "listo"; dias: DiaPronostico[] }
  | { estado: "error" };

const CARGANDO: EstadoPronostico = { estado: "cargando" };

/**
 * Pronóstico de 7 días (hoy primero) de la ubicación del clima actual. Se pide
 * cuando llega el clima, con las coordenadas que resolvió el proveedor, y se
 * cancela si cambia el clima. El clima actual se muestra sin esperarlo: si el
 * pronóstico falla, solo su panel pasa a estado de error.
 */
export function usePronostico(clima: ClimaActual | null): EstadoPronostico {
  const [respuesta, setRespuesta] = useState<{
    clima: ClimaActual;
    estado: EstadoPronostico;
  } | null>(null);

  useEffect(() => {
    if (!clima) return;
    const controlador = new AbortController();
    const params = new URLSearchParams({
      lat: formatearCoordenada(clima.coordenadas.lat),
      lon: formatearCoordenada(clima.coordenadas.lon),
    });

    async function pedir(): Promise<EstadoPronostico> {
      const respuestaHttp = await fetch(`/api/forecast?${params.toString()}`, {
        signal: controlador.signal,
      });
      const datos: unknown = await respuestaHttp.json().catch(() => null);
      return respuestaHttp.ok && esRespuestaPronostico(datos)
        ? { estado: "listo", dias: datos.dias }
        : { estado: "error" };
    }

    pedir()
      .then((estado) => setRespuesta({ clima, estado }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRespuesta({ clima, estado: { estado: "error" } });
      });
    return () => controlador.abort();
  }, [clima]);

  // La respuesta de otro clima (otra ciudad) no vale: mientras llega la nueva, carga.
  return clima && respuesta?.clima === clima ? respuesta.estado : CARGANDO;
}

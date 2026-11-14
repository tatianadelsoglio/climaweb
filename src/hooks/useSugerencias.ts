"use client";

import { useEffect, useState } from "react";
import { normalizarTexto } from "@/lib/cacheProveedores";
import {
  DEMORA_SUGERENCIAS_MS,
  MINIMO_CARACTERES,
  sugerenciasVigentes,
} from "@/lib/geocoding";
import type { BusquedaTexto } from "@/lib/parsearBusqueda";
import type { Sugerencia } from "@/types/geocoding";

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function esSugerencia(valor: unknown): valor is Sugerencia {
  return (
    esObjeto(valor) &&
    typeof valor.nombre === "string" &&
    (valor.estado === null || typeof valor.estado === "string") &&
    typeof valor.pais === "string" &&
    typeof valor.lat === "number" &&
    typeof valor.lon === "number"
  );
}

async function pedirSugerencias(
  ciudad: string,
  pais: string,
  signal: AbortSignal,
): Promise<Sugerencia[]> {
  const params = new URLSearchParams({ ciudad });
  if (pais) params.set("pais", pais);
  const respuesta = await fetch(`/api/geocode?${params.toString()}`, { signal });
  if (!respuesta.ok) throw new Error(`geocode ${respuesta.status}`);
  const datos: unknown = await respuesta.json();
  if (!esObjeto(datos) || !Array.isArray(datos.sugerencias)) {
    throw new Error("Respuesta de geocode inválida");
  }
  return datos.sugerencias.filter(esSugerencia);
}

/**
 * Sugerencias de lugares para lo escrito. Espera `demoraMs` sin cambios antes
 * de pedirlas, exige un mínimo de caracteres y cancela con AbortController la
 * búsqueda anterior; mientras llega la nueva no hay sugerencias. Si falla, no hay sugerencias: la búsqueda por texto sigue
 * funcionando. Con `busqueda` en null no hace nada.
 */
export function useSugerencias(
  busqueda: BusquedaTexto | null,
  demoraMs: number = DEMORA_SUGERENCIAS_MS,
): { sugerencias: Sugerencia[]; cargando: boolean } {
  // Normalizado: «Córd» y « córd » comparten URL y, con ella, la caché del CDN.
  const ciudad = normalizarTexto(busqueda?.ciudad ?? "");
  const pais = busqueda?.pais ?? "";
  const clave = busqueda && ciudad.length >= MINIMO_CARACTERES ? `${ciudad}|${pais}` : null;

  const [respuesta, setRespuesta] = useState<{ clave: string; sugerencias: Sugerencia[] } | null>(
    null,
  );

  useEffect(() => {
    if (clave === null) return;
    const controlador = new AbortController();
    const temporizador = setTimeout(async () => {
      try {
        const sugerencias = await pedirSugerencias(ciudad, pais, controlador.signal);
        setRespuesta({ clave, sugerencias });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRespuesta({ clave, sugerencias: [] });
      }
    }, demoraMs);
    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [clave, ciudad, pais, demoraMs]);

  // Al escribir, la respuesta anterior deja de valer en el acto: nunca se muestra
  // (ni se puede elegir con Enter) una sugerencia que no corresponde al texto actual.
  return {
    sugerencias: sugerenciasVigentes(respuesta, clave),
    cargando: clave !== null && respuesta?.clave !== clave,
  };
}

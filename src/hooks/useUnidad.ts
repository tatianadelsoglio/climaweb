"use client";

import { useCallback, useSyncExternalStore } from "react";
import { guardarAlmacenado, leerAlmacenado } from "@/lib/almacenamiento";
import { UNIDAD_INICIAL, esUnidad, type Unidad } from "@/lib/unidades";

const CLAVE = "atmosfera:unidad";

const oyentes = new Set<() => void>();
// Respaldo cuando localStorage no funciona: la elección vale para la sesión.
let enMemoria: Unidad | null = null;

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  window.addEventListener("storage", oyente);
  return () => {
    oyentes.delete(oyente);
    window.removeEventListener("storage", oyente);
  };
}

function leerUnidad(): Unidad {
  if (enMemoria) return enMemoria;
  const guardada = leerAlmacenado(CLAVE);
  return esUnidad(guardada) ? guardada : UNIDAD_INICIAL;
}

/**
 * Unidad de temperatura elegida, guardada en localStorage. En el servidor y en
 * la hidratación vale °C; después pasa a la guardada sin diferencia de hidratación.
 */
export function useUnidad(): [Unidad, (unidad: Unidad) => void] {
  const unidad = useSyncExternalStore(suscribir, leerUnidad, () => UNIDAD_INICIAL);

  const cambiar = useCallback((nueva: Unidad) => {
    enMemoria = nueva;
    guardarAlmacenado(CLAVE, nueva);
    oyentes.forEach((oyente) => oyente());
  }, []);

  return [unidad, cambiar];
}

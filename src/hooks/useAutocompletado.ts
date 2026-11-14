"use client";

import { useCallback, useState } from "react";
import { useSugerencias } from "@/hooks/useSugerencias";
import { parsearBusqueda } from "@/lib/parsearBusqueda";
import type { Sugerencia } from "@/types/geocoding";

export interface ControlAutocompletado {
  sugerencias: Sugerencia[];
  /** La lista se muestra: la persona escribió y hay resultados. */
  abierta: boolean;
  indiceActivo: number;
  /** Lo escrito sin el país, para marcar la coincidencia. */
  escrito: string;
  abrir: () => void;
  cerrar: () => void;
  /** Mueve la opción activa con vuelta al otro extremo. */
  mover: (delta: 1 | -1) => void;
  activar: (indice: number) => void;
}

/**
 * Estado del combobox de ciudades. La lista solo se abre cuando la persona
 * escribe (no al completar el campo por una elección o un chip), y la primera
 * opción queda activa, como en el diseño.
 */
export function useAutocompletado(texto: string): ControlAutocompletado {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);

  const { ciudad, pais } = parsearBusqueda(texto);
  // Una coma sin país reconocible no es una ciudad válida para la API.
  const consultable = abierto && !ciudad.includes(",");
  const { sugerencias } = useSugerencias(consultable ? { ciudad, pais } : null);

  const abrir = useCallback(() => {
    setAbierto(true);
    setActivo(0);
  }, []);
  const cerrar = useCallback(() => setAbierto(false), []);
  const mover = useCallback(
    (delta: 1 | -1) =>
      setActivo((previo) => {
        const total = sugerencias.length;
        return total === 0 ? 0 : (previo + delta + total) % total;
      }),
    [sugerencias.length],
  );

  return {
    sugerencias,
    abierta: consultable && sugerencias.length > 0,
    indiceActivo: Math.min(activo, Math.max(sugerencias.length - 1, 0)),
    escrito: ciudad,
    abrir,
    cerrar,
    mover,
    activar: setActivo,
  };
}

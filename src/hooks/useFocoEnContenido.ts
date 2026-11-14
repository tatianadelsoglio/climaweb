"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Mantiene el foco en un destino lógico cuando la acción que lo tenía (un
 * chip, «Reintentar») se desmonta al cambiar de estado (WCAG 2.4.3):
 * primero pasa al contenedor del contenido, que sigue montado mientras
 * carga, y cuando llega el estado final, a su título (h1).
 *
 * @param estadoFinal true cuando el estado actual ya tiene título propio.
 */
export function useFocoEnContenido(estado: string, estadoFinal: boolean) {
  const contenedorRef = useRef<HTMLElement>(null);
  const pendienteRef = useRef(false);

  const llevarFocoAlContenido = useCallback(() => {
    pendienteRef.current = true;
    contenedorRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!pendienteRef.current || !estadoFinal) return;
    pendienteRef.current = false;
    const contenedor = contenedorRef.current;
    // Si mientras cargaba la persona movió el foco (por ejemplo, al buscador), se respeta.
    if (!contenedor || document.activeElement !== contenedor) return;
    contenedor.querySelector<HTMLElement>("h1")?.focus();
  }, [estado, estadoFinal]);

  return { contenedorRef, llevarFocoAlContenido };
}

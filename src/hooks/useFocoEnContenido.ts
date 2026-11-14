"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Qué pasó con el foco en la última búsqueda, para que el anuncio en voz alta no
 * repita lo que el lector ya lee por el foco:
 * - null: la búsqueda no pidió mover el foco (por ejemplo, Enter en el buscador).
 * - "esperando": se pidió moverlo y todavía no llegó el resultado.
 * - "titulo": el foco llegó al título del resultado (el lector lo lee solo).
 * - "omitido": se pidió, pero la persona movió el foco mientras cargaba y se respetó.
 */
export type EstadoFoco = null | "esperando" | "titulo" | "omitido";

/**
 * Mantiene el foco en un destino lógico cuando la acción que lo tenía (un
 * chip, «Reintentar») se desmonta al cambiar de estado (WCAG 2.4.3):
 * primero pasa al contenedor del contenido, que sigue montado mientras
 * carga, y cuando llega el estado final, a su título (h1).
 *
 * @param estadoFinal true cuando el estado actual ya tiene título propio.
 * @param alResolver se llama al llegar el estado final de una búsqueda que pidió mover
 *   el foco, con true si el foco quedó en el título y false si se respetó que la persona
 *   lo hubiera movido. Tiene que ser estable (useCallback).
 */
export function useFocoEnContenido(
  estado: string,
  estadoFinal: boolean,
  alResolver?: (enTitulo: boolean) => void,
) {
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
    const titulo =
      contenedor && document.activeElement === contenedor
        ? contenedor.querySelector<HTMLElement>("h1")
        : null;
    titulo?.focus();
    alResolver?.(titulo !== null);
  }, [estado, estadoFinal, alResolver]);

  return { contenedorRef, llevarFocoAlContenido };
}

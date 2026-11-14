"use client";

import { useCallback, useState } from "react";

/** Ancho en píxeles de un elemento, actualizado con ResizeObserver. */
export function useAnchoElemento<T extends Element>() {
  const [ancho, setAncho] = useState<number | null>(null);

  const ref = useCallback((elemento: T | null) => {
    if (!elemento) return;
    const observador = new ResizeObserver(([entrada]) => {
      setAncho(entrada.contentRect.width);
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return { ref, ancho };
}

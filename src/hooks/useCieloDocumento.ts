"use client";

import { useEffect } from "react";
import type { Cielo } from "@/lib/resolverCielo";

function actualizarThemeColor(raiz: HTMLElement) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const color = getComputedStyle(raiz).getPropertyValue("--color-sky-top").trim();
  if (meta && color) meta.content = color;
}

/**
 * Lleva el cielo activo a <html>: su fondo (--color-sky-top) acompaña al
 * cielo en el rebote de scroll de iOS, y el theme-color de la barra del
 * navegador se actualiza. Como --color-sky-top se anima, el theme-color se
 * vuelve a leer cuando termina la transición (sin transición, al instante).
 */
export function useCieloDocumento(cielo: Cielo) {
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.sky = cielo;
    actualizarThemeColor(raiz);

    function alTerminar(evento: TransitionEvent) {
      if (evento.target === raiz && evento.propertyName === "--color-sky-top") {
        actualizarThemeColor(raiz);
      }
    }
    raiz.addEventListener("transitionend", alTerminar);
    return () => raiz.removeEventListener("transitionend", alTerminar);
  }, [cielo]);
}

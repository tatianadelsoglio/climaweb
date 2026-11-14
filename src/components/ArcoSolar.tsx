"use client";

import { useAnchoElemento } from "@/hooks/useAnchoElemento";

interface ArcoSolarProps {
  /** Ancho de la elipse en el .pen; se usa hasta medir el real. */
  anchoDiseno: number;
  /** Alto del contenedor del arco en el .pen. */
  alto: number;
  className: string;
}

// La elipse arranca 6px por debajo del borde superior del contenedor.
const MARGEN_SUPERIOR = 6;
// Radio interior de la elipse del .pen.
const RADIO_INTERIOR = 0.98;

/**
 * Recorrido del arco solar (mitad superior de la elipse del .pen). El grosor
 * del aro se fija con las medidas de diseño, así al estirarse en tablet no se
 * deforma. En la Fase 3a solo se dibuja el recorrido: el progreso y el sol
 * llegan con el arco solar de la Fase 3b.
 */
export default function ArcoSolar({ anchoDiseno, alto, className }: ArcoSolarProps) {
  const { ref, ancho: anchoMedido } = useAnchoElemento<SVGSVGElement>();
  const ancho = anchoMedido || anchoDiseno;

  const ry = alto - MARGEN_SUPERIOR;
  const grosorLado = (anchoDiseno / 2) * (1 - RADIO_INTERIOR);
  const grosorTope = ry * (1 - RADIO_INTERIOR);
  const rx = ancho / 2;
  const rxInterior = rx - grosorLado;
  const ryInterior = ry - grosorTope;

  const d = [
    `M0 ${alto}`,
    `A${rx} ${ry} 0 0 1 ${ancho} ${alto}`,
    `L${rx + rxInterior} ${alto}`,
    `A${rxInterior} ${ryInterior} 0 0 0 ${rx - rxInterior} ${alto}`,
    "Z",
  ].join(" ");

  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox={`0 0 ${ancho} ${alto}`}
      preserveAspectRatio="none"
      className={className}
    >
      <path d={d} className="fill-glass-line" />
    </svg>
  );
}

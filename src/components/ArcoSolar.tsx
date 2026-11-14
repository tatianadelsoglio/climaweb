"use client";

import { useAnchoElemento } from "@/hooks/useAnchoElemento";
import { posicionEnArco } from "@/lib/posicionSolar";

interface ArcoSolarProps {
  /** Ancho de la elipse en el .pen; se usa hasta medir el real. */
  anchoDiseno: number;
  /** Alto del contenedor del arco en el .pen. */
  alto: number;
  /** Radio interior del recorrido (pista) y del tramo ya recorrido, como en el .pen. */
  radioPista: number;
  radioProgreso: number;
  /** Radio del sol, en píxeles. */
  radioSol: number;
  /** De 0 a 1 de día; null de noche: solo se dibuja el recorrido, sin sol. */
  progreso: number | null;
  className: string;
}

// La elipse arranca 6px por debajo del borde superior del contenedor.
const MARGEN_SUPERIOR = 6;
// Con menos recorrido que esto el tramo no se llega a ver: solo se dibuja el sol.
const PROGRESO_MINIMO_VISIBLE = 0.002;

/**
 * Recorrido del arco solar (mitad superior de la elipse del .pen). El grosor
 * del aro se fija con las medidas de diseño, así al estirarse en tablet no se
 * deforma. De día suma el tramo recorrido y el sol, en su posición sobre la
 * elipse; de noche queda solo el recorrido.
 */
export default function ArcoSolar({
  anchoDiseno,
  alto,
  radioPista,
  radioProgreso,
  radioSol,
  progreso,
  className,
}: ArcoSolarProps) {
  const { ref, ancho: anchoMedido } = useAnchoElemento<SVGSVGElement>();
  const ancho = anchoMedido || anchoDiseno;

  const cx = ancho / 2;
  const ry = alto - MARGEN_SUPERIOR;
  const rx = cx;
  // Radios interiores de un aro: el grosor sale del diseño, no del ancho real.
  const interior = (radio: number) => ({
    rx: rx - (anchoDiseno / 2) * (1 - radio),
    ry: ry - ry * (1 - radio),
  });

  const pista = interior(radioPista);
  const dPista = [
    `M0 ${alto}`,
    `A${rx} ${ry} 0 0 1 ${ancho} ${alto}`,
    `L${cx + pista.rx} ${alto}`,
    `A${pista.rx} ${pista.ry} 0 0 0 ${cx - pista.rx} ${alto}`,
    "Z",
  ].join(" ");

  let dProgreso: string | null = null;
  let sol: { x: number; y: number } | null = null;
  if (progreso !== null) {
    const { x, y } = posicionEnArco(progreso);
    // Punto del sol sobre el borde exterior de la elipse.
    sol = { x: x * ancho, y: alto - y * ry };
    if (progreso >= PROGRESO_MINIMO_VISIBLE) {
      const recorrido = interior(radioProgreso);
      const coseno = (x - 0.5) * 2;
      const seno = y;
      dProgreso = [
        `M0 ${alto}`,
        `A${rx} ${ry} 0 0 1 ${sol.x} ${sol.y}`,
        `L${cx + recorrido.rx * coseno} ${alto - recorrido.ry * seno}`,
        `A${recorrido.rx} ${recorrido.ry} 0 0 0 ${cx - recorrido.rx} ${alto}`,
        "Z",
      ].join(" ");
    }
  }

  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox={`0 0 ${ancho} ${alto}`}
      preserveAspectRatio="none"
      className={`${className} overflow-visible`}
    >
      <path d={dPista} className="fill-glass-line" />
      {dProgreso && <path d={dProgreso} className="fill-accent" />}
      {sol && (
        <circle
          cx={sol.x}
          cy={sol.y}
          r={radioSol}
          className="fill-accent"
          style={{
            filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--color-accent) 67%, transparent))",
          }}
        />
      )}
    </svg>
  );
}

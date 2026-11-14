import type { Unidad } from "@/lib/unidades";

interface SelectorUnidadProps {
  unidad: Unidad;
  onCambiar: (unidad: Unidad) => void;
}

const CLASE_SEGMENTO =
  "flex h-11 w-12 items-center justify-center rounded-pill text-body font-bold lg:h-12 lg:w-[52px]";

const UNIDADES: readonly Unidad[] = ["C", "F"];

/** Alterna °C y °F: la conversión es del cliente, no vuelve a pedir datos. */
export default function SelectorUnidad({ unidad, onCambiar }: SelectorUnidadProps) {
  return (
    <div
      role="group"
      aria-label="Unidad de temperatura"
      className="glass flex gap-3xs rounded-pill p-toggle lg:p-2xs"
    >
      {UNIDADES.map((opcion) => (
        <button
          key={opcion}
          type="button"
          aria-pressed={unidad === opcion}
          onClick={() => onCambiar(opcion)}
          className={`${CLASE_SEGMENTO} ${unidad === opcion ? "bg-fg text-on-accent" : "text-fg"}`}
        >
          °{opcion}
        </button>
      ))}
    </div>
  );
}

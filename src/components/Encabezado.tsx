import type { ReactNode } from "react";
import BotonUbicacion from "@/components/BotonUbicacion";
import SelectorUnidad from "@/components/SelectorUnidad";
import type { Unidad } from "@/lib/unidades";

interface EncabezadoProps {
  /** Campo de búsqueda. */
  buscador: ReactNode;
  unidad: Unidad;
  onCambiarUnidad: (unidad: Unidad) => void;
}

/**
 * Mobile: marca y unidad arriba, buscador debajo.
 * Desktop: marca (200) · buscador centrado · unidad (200).
 */
export default function Encabezado({ buscador, unidad, onCambiarUnidad }: EncabezadoProps) {
  return (
    <header className="grid grid-cols-[1fr_auto] items-center px-xl lg:grid-cols-[200px_minmax(0,1fr)_200px] lg:gap-2xl lg:px-gutter lg:py-3xl">
      <p className="flex items-center gap-sm py-sm lg:gap-field lg:py-0">
        <span aria-hidden className="size-[14px] rounded-pill bg-accent lg:size-[18px]" />
        <span className="font-display text-subtitle font-bold tracking-[-0.4px] lg:text-stat lg:tracking-[-0.5px]">
          Atmósfera
        </span>
      </p>

      {/* El buscador va antes en el DOM para que el orden de tabulación siga al visual. */}
      <div className="relative col-span-2 row-start-2 flex items-start gap-sm pt-sm lg:static lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:justify-center lg:gap-md lg:pt-0">
        {buscador}
        <BotonUbicacion variante="encabezado" />
      </div>

      <div className="col-start-2 row-start-1 justify-self-end py-sm lg:col-start-3 lg:py-0">
        <SelectorUnidad unidad={unidad} onCambiar={onCambiarUnidad} />
      </div>
    </header>
  );
}

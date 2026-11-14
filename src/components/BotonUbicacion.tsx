import { LocateFixed } from "lucide-react";

interface BotonUbicacionProps {
  variante: "encabezado" | "primario";
}

const ETIQUETA = "Usar mi ubicación";

const CLASES: Record<BotonUbicacionProps["variante"], { boton: string; icono: string; etiqueta: string }> = {
  encabezado: {
    boton:
      "glass flex size-[52px] shrink-0 items-center justify-center rounded-pill lg:h-control lg:w-auto lg:gap-field lg:px-card",
    icono: "size-5 text-accent lg:size-[18px]",
    etiqueta: "sr-only text-body font-semibold lg:not-sr-only",
  },
  primario: {
    boton:
      "flex h-control w-full items-center justify-center gap-field rounded-pill bg-accent text-on-accent lg:w-auto lg:px-3xl",
    icono: "size-5",
    etiqueta: "text-button font-bold",
  },
};

/**
 * Lugar reservado para la geolocalización (Fase 3b): se muestra como en el
 * diseño pero todavía no está conectado, así que queda deshabilitado.
 */
export default function BotonUbicacion({ variante }: BotonUbicacionProps) {
  const clases = CLASES[variante];
  return (
    <button
      type="button"
      disabled
      title="Disponible próximamente"
      className={`${clases.boton} disabled:cursor-not-allowed`}
    >
      <LocateFixed aria-hidden className={clases.icono} />
      <span className={clases.etiqueta}>{ETIQUETA}</span>
    </button>
  );
}

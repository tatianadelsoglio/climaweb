import { LoaderCircle, LocateFixed } from "lucide-react";
import type { EstadoUbicacion } from "@/hooks/useGeolocalizacion";

interface BotonUbicacionProps {
  variante: "encabezado" | "primario";
  estado: EstadoUbicacion;
  onUbicar: () => void;
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
 * Pide la ubicación del dispositivo. Mientras busca muestra un indicador y no
 * admite otro pedido; con la ubicación no disponible el botón del encabezado se
 * atenúa, como en el diseño, pero se puede volver a intentar.
 */
export default function BotonUbicacion({ variante, estado, onUbicar }: BotonUbicacionProps) {
  const clases = CLASES[variante];
  const buscando = estado === "buscando";
  const Icono = buscando ? LoaderCircle : LocateFixed;
  const atenuado = variante === "encabezado" && estado === "no-disponible";

  return (
    <button
      type="button"
      onClick={onUbicar}
      disabled={buscando}
      aria-busy={buscando}
      className={`${clases.boton} disabled:cursor-wait ${atenuado ? "opacity-50" : ""}`}
    >
      <Icono aria-hidden className={`${clases.icono} ${buscando ? "animate-spin" : ""}`} />
      <span className={clases.etiqueta}>{ETIQUETA}</span>
    </button>
  );
}

import { MapPin } from "lucide-react";

interface ChipCiudadProps {
  nombre: string;
  onElegir: () => void;
  className?: string;
}

export default function ChipCiudad({ nombre, onElegir, className = "" }: ChipCiudadProps) {
  return (
    <button
      type="button"
      onClick={onElegir}
      className={`glass flex h-11 items-center gap-xs rounded-pill px-lg text-body font-semibold lg:h-12 lg:gap-sm lg:px-xl ${className}`}
    >
      <MapPin aria-hidden className="size-3.5 text-accent lg:size-4" />
      {nombre}
    </button>
  );
}

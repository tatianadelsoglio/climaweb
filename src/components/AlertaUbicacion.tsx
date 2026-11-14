import { LocateOff, MapPinOff, X } from "lucide-react";

interface AlertaUbicacionProps {
  tipo: "denegado" | "no-disponible";
  onCerrar: () => void;
}

const CONTENIDO = {
  denegado: {
    Icono: MapPinOff,
    titulo: "Permiso de ubicación denegado",
    cuerpo:
      "Habilitá la ubicación para este sitio en la configuración del navegador, o buscá tu ciudad.",
  },
  "no-disponible": {
    Icono: LocateOff,
    titulo: "No pudimos obtener tu ubicación",
    cuerpo:
      "Tu dispositivo no está compartiendo la ubicación ahora (sin GPS o sin señal). Probá de nuevo o buscá tu ciudad.",
  },
} as const;

/** Aviso de geolocalización fallida. role="alert": se anuncia al aparecer. */
export default function AlertaUbicacion({ tipo, onCerrar }: AlertaUbicacionProps) {
  const { Icono, titulo, cuerpo } = CONTENIDO[tipo];

  return (
    <div className="px-xl pt-md lg:px-gutter">
      <div
        role="alert"
        className="flex items-start gap-md rounded-lg bg-panel p-lg lg:max-w-[560px]"
      >
        <Icono aria-hidden className="size-5 shrink-0 text-panel-warning" />
        <div className="flex min-w-0 flex-1 flex-col gap-2xs">
          <p className="text-body font-bold text-panel-ink">{titulo}</p>
          <p className="text-caption leading-[1.45] text-panel-muted">{cuerpo}</p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          className="flex size-11 shrink-0 items-center justify-center rounded-pill text-panel-muted"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}

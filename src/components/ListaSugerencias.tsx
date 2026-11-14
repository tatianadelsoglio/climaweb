import { CornerDownLeft, MapPin } from "lucide-react";
import { dividirCoincidencia, regionSugerencia } from "@/lib/sugerencias";
import type { Sugerencia } from "@/types/geocoding";

interface ListaSugerenciasProps {
  id: string;
  /** Prefijo de los ids de las opciones (para aria-activedescendant). */
  prefijoOpcion: string;
  sugerencias: Sugerencia[];
  indiceActivo: number;
  escrito: string;
  onActivar: (indice: number) => void;
  onElegir: (sugerencia: Sugerencia) => void;
}

const TECLAS = [
  { tecla: "↑ ↓", accion: "moverte" },
  { tecla: "Enter", accion: "elegir" },
  { tecla: "Esc", accion: "cerrar" },
] as const;

export function idOpcion(prefijo: string, indice: number): string {
  return `${prefijo}-${indice}`;
}

/**
 * Listbox del combobox de ciudades. El foco nunca sale del campo: la opción
 * activa se informa con aria-activedescendant, y el mouse no le quita el foco.
 */
export default function ListaSugerencias({
  id,
  prefijoOpcion,
  sugerencias,
  indiceActivo,
  escrito,
  onActivar,
  onElegir,
}: ListaSugerenciasProps) {
  return (
    <div className="absolute top-full right-0 left-0 z-30 mt-3xs rounded-lg bg-panel p-sm shadow-popover lg:mt-sm">
      <ul id={id} role="listbox" aria-label="Sugerencias de ciudades">
        {sugerencias.map((sugerencia, indice) => {
          const activa = indice === indiceActivo;
          const { coincide, resto } = dividirCoincidencia(sugerencia.nombre, escrito);
          return (
            <li
              key={`${sugerencia.lat},${sugerencia.lon},${indice}`}
              id={idOpcion(prefijoOpcion, indice)}
              role="option"
              aria-selected={activa}
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => !activa && onActivar(indice)}
              onClick={() => onElegir(sugerencia)}
              className={`flex cursor-pointer items-center gap-md rounded-md px-md py-field lg:h-14 lg:px-inset lg:py-0 ${
                activa ? "bg-panel-highlight" : ""
              }`}
            >
              <MapPin aria-hidden className="size-[18px] shrink-0 text-panel-accent" />
              <span className="flex min-w-0 flex-1 flex-col gap-3xs lg:flex-row lg:items-baseline lg:gap-0">
                <span className="truncate text-body text-panel-ink">
                  <span className="font-extrabold">{coincide}</span>
                  {resto}
                </span>
                <span className="truncate text-caption text-panel-muted lg:text-body">
                  <span aria-hidden className="hidden lg:inline">
                    ,{" "}
                  </span>
                  {regionSugerencia(sugerencia)}
                </span>
              </span>
              {activa && (
                <CornerDownLeft
                  aria-hidden
                  className="hidden size-4 shrink-0 text-panel-accent lg:block"
                />
              )}
            </li>
          );
        })}
      </ul>
      <p aria-hidden className="hidden gap-lg px-inset pt-md pb-xs lg:flex">
        {TECLAS.map(({ tecla, accion }) => (
          <span key={tecla} className="flex items-center gap-xs text-overline text-panel-muted">
            <kbd className="rounded-xs bg-panel-key px-sm py-3xs font-sans text-micro font-bold">
              {tecla}
            </kbd>
            {accion}
          </span>
        ))}
      </p>
    </div>
  );
}

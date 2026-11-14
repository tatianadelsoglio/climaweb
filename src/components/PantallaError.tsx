import { CloudOff, MapPinOff, RefreshCw } from "lucide-react";
import ChipCiudad from "@/components/ChipCiudad";
import type { TipoError } from "@/hooks/useClima";
import { etiquetasCortas } from "@/lib/sugerencias";
import type { Sugerencia } from "@/types/geocoding";

interface PantallaErrorProps {
  tipo: TipoError;
  consulta: string;
  /** Lugares parecidos a la ciudad que no se encontró («¿Quisiste decir…?»). */
  alternativas: Sugerencia[];
  onElegirAlternativa: (sugerencia: Sugerencia) => void;
  onReintentar: () => void;
}

const MENSAJE_SERVICIO =
  "No es tu búsqueda: no pudimos conectar con el proveedor de datos. Probá de nuevo en unos segundos.";

/** El detalle del error lo anuncia AnuncioEstado. */
export default function PantallaError({
  tipo,
  consulta,
  alternativas,
  onElegirAlternativa,
  onReintentar,
}: PantallaErrorProps) {
  const esCiudad = tipo === "ciudad";
  const hayAlternativas = esCiudad && alternativas.length > 0;
  const etiquetas = etiquetasCortas(alternativas);
  const Icono = esCiudad ? MapPinOff : CloudOff;
  const colorTono = esCiudad ? "text-danger" : "text-accent";

  return (
    <div className="flex flex-1 flex-col gap-xl px-xl pt-4xl pb-4xl lg:justify-center lg:gap-2xl lg:px-gutter lg:pt-2xl lg:pb-gutter">
      <div className="glass flex size-16 items-center justify-center rounded-xl lg:size-[72px]">
        <Icono aria-hidden className={`size-7 lg:size-8 ${colorTono}`} />
      </div>

      <p className={`text-overline font-bold tracking-[2px] uppercase lg:text-caption ${colorTono}`}>
        {esCiudad ? "Sin resultados" : "Error del servicio"}
      </p>

      <h1 tabIndex={-1} className="outline-none font-display text-heading-sm leading-[1.05] font-semibold tracking-[-1px] break-words lg:w-[760px] lg:max-w-full lg:text-display lg:leading-[1.02] lg:tracking-[-1.5px]">
        {esCiudad ? `No encontramos “${consulta}”.` : "Hoy el servicio del clima está nublado."}
      </h1>

      <p className="text-button leading-[1.5] text-fg-muted lg:w-[640px] lg:max-w-full lg:text-subtitle">
        {esCiudad ? (
          <>
            <span className="lg:hidden">
              Revisá cómo está escrita o agregá el país (“Córdoba, AR”).
              {hayAlternativas && " ¿Quisiste decir…?"}
            </span>
            <span className="hidden lg:inline">
              Puede que esté mal escrita o que no exista con ese nombre. Probá agregar el país
              (“Córdoba, AR”){hayAlternativas ? " o elegí una de estas:" : "."}
            </span>
          </>
        ) : (
          MENSAJE_SERVICIO
        )}
      </p>

      {/* En desktop el lugar de las sugerencias se reserva siempre, para que el contenido no salte. */}
      {esCiudad && (
        <div className="lg:min-h-control">
          {hayAlternativas && (
            <ul aria-label="¿Quisiste decir…?" className="flex flex-col items-start gap-sm lg:flex-row lg:flex-wrap">
              {alternativas.map((alternativa, i) => (
                <li key={`${alternativa.lat},${alternativa.lon},${i}`}>
                  <ChipCiudad nombre={etiquetas[i]} onElegir={() => onElegirAlternativa(alternativa)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!esCiudad && (
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:pt-sm">
          <button
            type="button"
            onClick={onReintentar}
            className="flex h-control w-full items-center justify-center gap-field rounded-pill bg-accent text-on-accent lg:w-auto lg:px-3xl"
          >
            <RefreshCw aria-hidden className="size-5" />
            <span className="text-button font-bold">Reintentar</span>
          </button>
          <p className="hidden text-body text-fg-muted lg:block">
            Si sigue fallando, intentá más tarde.
          </p>
        </div>
      )}
    </div>
  );
}

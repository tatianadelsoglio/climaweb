"use client";

import { Sun } from "lucide-react";
import BotonUbicacion from "@/components/BotonUbicacion";
import ChipCiudad from "@/components/ChipCiudad";
import type { EstadoUbicacion } from "@/hooks/useGeolocalizacion";
import { useFechaHoy } from "@/hooks/useFechaHoy";
import type { BusquedaValida } from "@/lib/validarBusqueda";

export interface CiudadSugerida {
  nombre: string;
  busqueda: BusquedaValida;
  /** El diseño desktop muestra tres sugerencias; mobile, cuatro. */
  soloMobile?: boolean;
}

const SUGERENCIAS: readonly CiudadSugerida[] = [
  { nombre: "Buenos Aires", busqueda: { ciudad: "Buenos Aires", pais: "AR" } },
  { nombre: "Madrid", busqueda: { ciudad: "Madrid", pais: "ES" } },
  {
    nombre: "Ciudad de México",
    busqueda: { ciudad: "Ciudad de México", pais: "MX" },
    soloMobile: true,
  },
  { nombre: "Tokio", busqueda: { ciudad: "Tokio", pais: "JP" } },
];

interface PantallaInicialProps {
  onElegirCiudad: (ciudad: CiudadSugerida) => void;
  estadoUbicacion: EstadoUbicacion;
  onUbicar: () => void;
}

export default function PantallaInicial({
  onElegirCiudad,
  estadoUbicacion,
  onUbicar,
}: PantallaInicialProps) {
  const fecha = useFechaHoy();

  return (
    <div className="flex flex-1 flex-col gap-xl px-xl pt-4xl pb-4xl lg:justify-center lg:gap-3xl lg:px-gutter lg:pt-2xl lg:pb-gutter">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[180px] right-[20px] -z-10 hidden size-[520px] items-center justify-center opacity-16 lg:flex"
      >
        <Sun className="size-[460px]" />
      </div>

      <p className="min-h-4 text-overline font-bold tracking-[2px] text-accent uppercase lg:min-h-[17px] lg:text-caption">
        {fecha ?? " "}
      </p>

      <h1 className="font-display text-hero-mobile leading-none font-semibold tracking-[-1.5px] lg:w-[860px] lg:max-w-full lg:text-hero-desktop lg:leading-[0.98] lg:tracking-[-3px]">
        El cielo de cualquier ciudad, en un vistazo.
      </h1>

      <p className="text-button leading-[1.5] text-fg-muted lg:w-[640px] lg:max-w-full lg:text-subtitle">
        <span className="lg:hidden">Buscá una ciudad o dejá que la encontremos por vos.</span>
        <span className="hidden lg:inline">
          Buscá una ciudad arriba o dejá que la encontremos por vos. Te mostramos la
          temperatura, cómo se siente y qué viene en los próximos 5 días.
        </span>
      </p>

      <div className="flex flex-col gap-xl lg:flex-row lg:items-center lg:gap-lg lg:pt-sm">
        <BotonUbicacion variante="primario" estado={estadoUbicacion} onUbicar={onUbicar} />

        <div className="flex flex-col gap-field pt-sm lg:flex-row lg:items-center lg:gap-lg lg:pt-0">
          <p className="text-caption text-fg-muted lg:text-body">o probá con</p>
          <ul className="flex flex-wrap gap-sm">
            {SUGERENCIAS.map((ciudad) => (
              <li key={ciudad.nombre} className={ciudad.soloMobile ? "lg:hidden" : undefined}>
                <ChipCiudad nombre={ciudad.nombre} onElegir={() => onElegirCiudad(ciudad)} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

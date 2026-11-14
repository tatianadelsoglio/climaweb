import { Droplets, Sunrise, Sunset, Wind, type LucideIcon } from "lucide-react";
import ArcoSolar from "@/components/ArcoSolar";
import {
  formatearHoraLocal,
  formatearHumedad,
  formatearViento,
} from "@/lib/formatoClima";
import type { ClimaActual } from "@/types/clima";

interface PanelDatosProps {
  clima: ClimaActual;
}

function Dato({ icono: Icono, etiqueta, valor }: { icono: LucideIcon; etiqueta: string; valor: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2xs lg:gap-xs">
      <dt className="flex items-center gap-xs text-caption text-fg-muted lg:gap-sm">
        <Icono aria-hidden className="size-3.5 lg:size-4" />
        {etiqueta}
      </dt>
      <dd className="font-display text-stat font-semibold lg:text-title">{valor}</dd>
    </div>
  );
}

function HoraSolar({
  icono: Icono,
  etiqueta,
  hora,
}: {
  icono: LucideIcon;
  etiqueta: string;
  hora: string;
}) {
  return (
    <p className="flex items-center gap-xs text-body font-bold lg:gap-sm lg:font-semibold">
      <Icono aria-hidden className="size-4 text-accent lg:size-[18px]" />
      <span>
        <span className="sr-only lg:not-sr-only">{etiqueta} </span>
        {hora}
      </span>
    </p>
  );
}

export default function PanelDatos({ clima }: PanelDatosProps) {
  const { zonaHoraria, amanecer, atardecer } = clima;
  const hayHorarioSolar = amanecer !== null && atardecer !== null;

  return (
    <section aria-label="Detalles" className="glass flex flex-col rounded-xl lg:rounded-2xl">
      <dl className="flex gap-lg px-xl py-lg lg:gap-2xl lg:px-2xl lg:py-xl">
        <Dato icono={Droplets} etiqueta="Humedad" valor={formatearHumedad(clima.humedad)} />
        <Dato
          icono={Wind}
          etiqueta="Viento"
          valor={formatearViento(clima.viento.velocidad, clima.viento.direccion)}
        />
      </dl>

      {hayHorarioSolar && (
        <div className="flex flex-col gap-sm shadow-[inset_0_1px_0_var(--color-glass-line)] px-xl pt-inset pb-lg lg:px-2xl lg:pt-lg lg:pb-xl">
          <ArcoSolar anchoDiseno={308} alto={70} className="h-[70px] w-full lg:hidden" />
          <ArcoSolar anchoDiseno={472} alto={96} className="hidden h-24 w-full lg:block" />
          <div className="flex justify-between">
            <HoraSolar
              icono={Sunrise}
              etiqueta="Amanecer"
              hora={formatearHoraLocal(amanecer, zonaHoraria)}
            />
            <HoraSolar
              icono={Sunset}
              etiqueta="Atardecer"
              hora={formatearHoraLocal(atardecer, zonaHoraria)}
            />
          </div>
        </div>
      )}
    </section>
  );
}

import { Umbrella } from "lucide-react";
import IconoCondicion from "@/components/IconoCondicion";
import { formatearDiaPronostico, formatearTemperatura } from "@/lib/formatoClima";
import type { Unidad } from "@/lib/unidades";
import type { DiaPronostico } from "@/types/clima";

interface PanelPronosticoProps {
  /** null cuando el pronóstico no pudo obtenerse. */
  dias: DiaPronostico[] | null;
  zonaHoraria: number;
  unidad: Unidad;
}

function Lluvia({ porcentaje, className }: { porcentaje: number; className: string }) {
  return (
    <p className={`items-center gap-2xs text-caption text-fg-muted ${className}`}>
      <Umbrella aria-hidden className="size-3.5" />
      <span>
        <span className="sr-only">Probabilidad de lluvia </span>
        {porcentaje} %
      </span>
    </p>
  );
}

function Dia({
  dia,
  zonaHoraria,
  unidad,
}: {
  dia: DiaPronostico;
  zonaHoraria: number;
  unidad: Unidad;
}) {
  const etiquetaCorta = formatearDiaPronostico(dia.instante, zonaHoraria, false);
  const etiquetaLarga = formatearDiaPronostico(dia.instante, zonaHoraria, true);

  return (
    <li className="flex min-w-0 flex-1 flex-col items-center gap-sm border-l border-glass-line py-lg first:border-l-0 lg:flex-row lg:gap-lg lg:px-lg lg:py-xl xl:px-2xl">
      {/* Mobile: día, ícono y temperaturas en columna. Desktop: ícono, texto y lluvia en fila. */}
      <IconoCondicion
        codigo={dia.codigo}
        noche={false}
        className="order-2 size-7 shrink-0 lg:order-1 lg:size-9"
      />
      <div className="contents lg:order-2 lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-3xs">
        <p className="order-1 text-caption font-semibold whitespace-nowrap text-fg-muted lg:order-none">
          <span className="lg:hidden">{etiquetaCorta}</span>
          <span className="hidden lg:inline">{etiquetaLarga}</span>
        </p>
        <p className="order-3 flex flex-col items-center gap-sm lg:order-none lg:flex-row lg:items-end">
          <span className="font-display text-stat font-semibold lg:text-title-lg">
            <span className="sr-only">Máxima </span>
            {formatearTemperatura(dia.maxima, unidad)}
          </span>
          <span className="text-caption text-fg-muted lg:pb-3xs lg:text-lead lg:font-medium">
            <span className="sr-only">Mínima </span>
            {formatearTemperatura(dia.minima, unidad)}
          </span>
        </p>
        {/* Con poco ancho (lg a xl) la lluvia va debajo del texto; desde xl, a la derecha. */}
        <Lluvia
          porcentaje={dia.probabilidadLluvia}
          className="order-4 hidden lg:order-none lg:flex xl:hidden"
        />
      </div>
      <Lluvia
        porcentaje={dia.probabilidadLluvia}
        className="order-4 hidden shrink-0 xl:flex"
      />
    </li>
  );
}

export default function PanelPronostico({ dias, zonaHoraria, unidad }: PanelPronosticoProps) {
  const hayDias = dias !== null && dias.length > 0;

  return (
    <section aria-labelledby="titulo-pronostico" className="flex flex-col gap-xl">
      <h2
        id="titulo-pronostico"
        className="pt-sm font-display text-subtitle font-semibold lg:sr-only"
      >
        Próximos 5 días
      </h2>
      <div className="glass overflow-hidden rounded-xl lg:rounded-2xl">
        {hayDias ? (
          <ol className="flex">
            {dias.map((dia) => (
              <Dia key={dia.fecha} dia={dia} zonaHoraria={zonaHoraria} unidad={unidad} />
            ))}
          </ol>
        ) : (
          <p className="flex min-h-[144px] items-center justify-center px-xl text-center text-caption text-fg-muted lg:min-h-[93px]">
            No pudimos cargar el pronóstico de los próximos días.
          </p>
        )}
      </div>
    </section>
  );
}

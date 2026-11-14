import { Umbrella } from "lucide-react";
import IconoCondicion from "@/components/IconoCondicion";
import type { EstadoPronostico } from "@/hooks/usePronostico";
import { descripcionCondicion } from "@/lib/condiciones";
import { formatearDiaPronostico, formatearTemperatura } from "@/lib/formatoClima";
import type { Unidad } from "@/lib/unidades";
import type { DiaPronostico } from "@/types/clima";

interface PanelPronosticoProps {
  pronostico: EstadoPronostico;
  unidad: Unidad;
}

const DIAS = 7;

function Lluvia({ porcentaje, className }: { porcentaje: number | null; className: string }) {
  if (porcentaje === null) return null;
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

/**
 * Un día. Mobile y tablet: una fila (día · ícono · lluvia · temperaturas), porque
 * 7 columnas no entran en 350 px. Desktop: una columna por día.
 */
function Dia({ dia, esHoy, unidad }: { dia: DiaPronostico; esHoy: boolean; unidad: Unidad }) {
  const etiqueta = esHoy ? "Hoy" : formatearDiaPronostico(dia.fecha, true);

  return (
    <li className="flex items-center gap-md border-t border-glass-line px-xl py-md first:border-t-0 lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-sm lg:border-t-0 lg:border-l lg:px-md lg:py-xl lg:first:border-l-0">
      <p className="w-[72px] shrink-0 text-caption font-semibold whitespace-nowrap text-fg-muted lg:w-auto">
        {etiqueta}
        <span className="sr-only">: {descripcionCondicion(dia.codigo)}</span>
      </p>
      <IconoCondicion codigo={dia.codigo} noche={false} className="size-7 shrink-0 lg:size-9" />
      <Lluvia porcentaje={dia.probabilidadLluvia} className="flex lg:order-last" />
      <p className="ml-auto flex items-baseline gap-sm lg:ml-0 lg:flex-col lg:items-center lg:gap-3xs">
        <span className="font-display text-stat font-semibold lg:text-title-lg">
          <span className="sr-only">Máxima </span>
          {formatearTemperatura(dia.maxima, unidad)}
        </span>
        <span className="text-caption text-fg-muted lg:text-lead lg:font-medium">
          <span className="sr-only">Mínima </span>
          {formatearTemperatura(dia.minima, unidad)}
        </span>
      </p>
    </li>
  );
}

function Mensaje({ children }: { children: string }) {
  return (
    <p className="flex min-h-[144px] items-center justify-center px-xl text-center text-caption text-fg-muted lg:min-h-[93px]">
      {children}
    </p>
  );
}

function Esqueleto() {
  return (
    <div aria-hidden className="flex flex-col lg:flex-row">
      {Array.from({ length: DIAS }, (_, i) => (
        <div
          key={i}
          className="flex h-14 items-center gap-md border-t border-glass-line px-xl first:border-t-0 lg:h-[140px] lg:flex-1 lg:flex-col lg:justify-center lg:border-t-0 lg:border-l lg:first:border-l-0"
        >
          <div className="h-4 w-[72px] animate-pulse rounded-xs bg-skeleton lg:w-12" />
          <div className="size-7 animate-pulse rounded-pill bg-skeleton lg:size-9" />
          <div className="ml-auto h-6 w-16 animate-pulse rounded-xs bg-skeleton lg:ml-0" />
        </div>
      ))}
    </div>
  );
}

export default function PanelPronostico({ pronostico, unidad }: PanelPronosticoProps) {
  return (
    <section aria-labelledby="titulo-pronostico" className="flex flex-col gap-xl">
      <h2
        id="titulo-pronostico"
        className="pt-sm font-display text-subtitle font-semibold lg:sr-only"
      >
        Próximos 7 días
      </h2>
      <div
        aria-busy={pronostico.estado === "cargando"}
        className="glass overflow-hidden rounded-xl lg:rounded-2xl"
      >
        {pronostico.estado === "listo" && (
          <ol className="flex flex-col lg:flex-row">
            {pronostico.dias.map((dia, i) => (
              <Dia key={dia.fecha} dia={dia} esHoy={i === 0} unidad={unidad} />
            ))}
          </ol>
        )}
        {pronostico.estado === "cargando" && <Esqueleto />}
        {pronostico.estado === "error" && (
          <Mensaje>No pudimos cargar el pronóstico de los próximos días.</Mensaje>
        )}
      </div>
    </section>
  );
}

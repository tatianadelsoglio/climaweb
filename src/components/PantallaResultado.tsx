import { ArrowDown, ArrowUp, MapPin, type LucideIcon } from "lucide-react";
import IconoCondicion from "@/components/IconoCondicion";
import PanelDatos from "@/components/PanelDatos";
import PanelPronostico from "@/components/PanelPronostico";
import {
  formatearDescripcion,
  formatearFechaLocal,
  formatearHoraLocal,
  formatearTemperatura,
  nombrePais,
} from "@/lib/formatoClima";
import type { Cielo } from "@/lib/resolverCielo";
import type { ClimaActual } from "@/types/clima";

interface PantallaResultadoProps {
  clima: ClimaActual;
  cielo: Cielo;
}

function Extremo({ icono: Icono, etiqueta, valor }: { icono: LucideIcon; etiqueta: string; valor: number }) {
  return (
    <p className="flex items-center gap-3xs lg:gap-2xs">
      <Icono aria-hidden className="size-4 text-fg-muted lg:size-[18px]" />
      <span className="font-bold text-fg lg:font-semibold">
        <span className="sr-only lg:not-sr-only">{etiqueta} </span>
        {formatearTemperatura(valor)}
      </span>
    </p>
  );
}

export default function PantallaResultado({ clima, cielo }: PantallaResultadoProps) {
  const { momento, zonaHoraria } = clima;
  const hora = formatearHoraLocal(momento, zonaHoraria);
  const temperatura = formatearTemperatura(clima.temperatura);
  // Con 4 caracteres (104°, −12°) el número se achica solo si no entra en su fila.
  const tamanioTemperatura =
    temperatura.length > 3
      ? "text-[length:min(var(--text-temp-mobile),39cqi)] lg:text-[length:min(var(--text-temp-desktop),64cqi)]"
      : "text-temp-mobile lg:text-temp-desktop";

  return (
    <div className="flex flex-1 flex-col gap-xl px-xl pt-3xl pb-4xl lg:gap-4xl lg:px-gutter lg:pt-2xl lg:pb-5xl">
      <div className="flex flex-col gap-xl lg:flex-1 lg:flex-row lg:gap-5xl">
        <section
          aria-labelledby="titulo-ciudad"
          className="flex min-w-0 flex-col gap-2xs lg:flex-1 lg:justify-between lg:gap-0"
        >
          <div className="flex flex-col gap-2xs lg:gap-sm">
            <h1 id="titulo-ciudad" className="flex items-center gap-xs lg:gap-sm">
              <MapPin aria-hidden className="size-[18px] shrink-0 text-accent lg:size-5" />
              <span className="font-display text-subtitle font-semibold lg:text-title">
                {clima.ciudad}, {nombrePais(clima.pais)}
              </span>
            </h1>
            <p className="text-caption text-fg-muted lg:text-body">
              <span className="lg:hidden">{formatearFechaLocal(momento, zonaHoraria, "corta")}</span>
              <span className="hidden lg:inline">
                {formatearFechaLocal(momento, zonaHoraria, "larga")}
              </span>
              {` · ${hora} hora local`}
            </p>
          </div>

          <div className="flex flex-col gap-2xs lg:gap-0">
            <div className="@container flex items-center justify-between gap-sm pt-sm lg:pt-0">
              <p
                className={`font-display leading-[0.9] font-medium tracking-[-7px] whitespace-nowrap lg:leading-[0.85] lg:tracking-[-12px] ${tamanioTemperatura}`}
              >
                {temperatura}
              </p>
              <IconoCondicion
                codigo={clima.condicion.codigo}
                cielo={cielo}
                className="size-[min(104px,30cqi)] shrink-0 lg:hidden"
              />
            </div>
            <p className="font-display text-title-lg font-semibold tracking-[-0.6px] lg:text-heading lg:tracking-[-1px]">
              {formatearDescripcion(clima.condicion.descripcion)}
            </p>
            <div className="flex flex-wrap items-center gap-x-inset pt-sm text-body lg:gap-x-xl lg:pt-lg lg:text-lead">
              <p className="text-fg-muted">
                Sensación {formatearTemperatura(clima.sensacionTermica)}
              </p>
              <Extremo icono={ArrowUp} etiqueta="Máx" valor={clima.temperaturaMaxima} />
              <Extremo icono={ArrowDown} etiqueta="Mín" valor={clima.temperaturaMinima} />
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:w-[520px] lg:shrink-0 lg:justify-end lg:gap-lg">
          <div className="hidden flex-1 items-center justify-center lg:flex">
            <IconoCondicion
              codigo={clima.condicion.codigo}
              cielo={cielo}
              className="size-[220px]"
            />
          </div>
          <PanelDatos clima={clima} />
        </div>
      </div>

      <PanelPronostico />
    </div>
  );
}

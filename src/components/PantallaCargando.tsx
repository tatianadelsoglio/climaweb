import { LoaderCircle } from "lucide-react";

interface PantallaCargandoProps {
  consulta: string;
}

function Esqueleto({ className }: { className: string }) {
  return <div className={`animate-pulse bg-skeleton ${className}`} />;
}

function Estado({ consulta, className }: { consulta: string; className: string }) {
  return (
    <p className={`flex items-center gap-sm text-fg-muted ${className}`}>
      <LoaderCircle aria-hidden className="size-4 animate-spin text-accent lg:size-[18px]" />
      Mirando el cielo de {consulta}…
    </p>
  );
}

/** El anuncio para lectores de pantalla lo hace AnuncioEstado. */
export default function PantallaCargando({ consulta }: PantallaCargandoProps) {
  return (
    <>
      {/* Mobile */}
      <div className="flex flex-1 flex-col gap-xl px-xl pt-4xl pb-4xl lg:hidden">
        <Estado consulta={consulta} className="text-caption" />
        <Esqueleto className="h-6 w-[220px] max-w-full rounded-sm" />
        <div className="flex items-center justify-between">
          <Esqueleto className="h-[120px] w-[190px] rounded-xl" />
          <Esqueleto className="size-24 rounded-pill" />
        </div>
        <Esqueleto className="h-[30px] w-[240px] max-w-full rounded-sm" />
        <Esqueleto className="h-[200px] w-full rounded-xl" />
        <Esqueleto className="h-[130px] w-full rounded-xl" />
      </div>

      {/* Desktop */}
      <div className="hidden flex-1 flex-col gap-4xl px-gutter pt-2xl pb-5xl lg:flex">
        <div className="flex flex-1 gap-5xl">
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="flex flex-col gap-field">
              <Estado consulta={consulta} className="text-body" />
              <Esqueleto className="h-7 w-[280px] rounded-sm" />
            </div>
            <div className="flex flex-col gap-lg">
              <Esqueleto className="h-[190px] w-[360px] max-w-full rounded-2xl" />
              <Esqueleto className="h-10 w-[420px] max-w-full rounded-sm" />
              <Esqueleto className="h-5 w-[300px] max-w-full rounded-sm" />
            </div>
          </div>
          <div className="flex w-[520px] shrink flex-col justify-end">
            <Esqueleto className="h-[250px] w-full rounded-2xl" />
          </div>
        </div>
        <div className="flex gap-md">
          {Array.from({ length: 7 }, (_, i) => (
            <Esqueleto key={i} className="h-[100px] flex-1 rounded-2xl" />
          ))}
        </div>
      </div>
    </>
  );
}

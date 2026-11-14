const CLASE_SEGMENTO =
  "flex h-11 w-12 items-center justify-center rounded-pill text-body font-bold lg:h-12 lg:w-[52px]";

/**
 * Lugar reservado para °C/°F (Fase 3b): °C queda fijo y °F deshabilitado
 * hasta conectar la conversión.
 */
export default function SelectorUnidad() {
  return (
    <div
      role="group"
      aria-label="Unidad de temperatura"
      className="glass flex gap-3xs rounded-pill p-toggle lg:p-2xs"
    >
      <button
        type="button"
        aria-pressed="true"
        className={`${CLASE_SEGMENTO} bg-fg text-on-accent`}
      >
        °C
      </button>
      <button
        type="button"
        aria-pressed="false"
        disabled
        title="Disponible próximamente"
        className={`${CLASE_SEGMENTO} text-fg disabled:cursor-not-allowed`}
      >
        °F
      </button>
    </div>
  );
}

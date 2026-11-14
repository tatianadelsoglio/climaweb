/**
 * Lugar reservado para el pronóstico de 5 días (Fase 3b), con las medidas
 * del diseño.
 */
export default function PanelPronostico() {
  return (
    <section aria-labelledby="titulo-pronostico" className="flex flex-col gap-xl">
      <h2
        id="titulo-pronostico"
        className="pt-sm font-display text-subtitle font-semibold lg:sr-only"
      >
        Próximos 5 días
      </h2>
      <div className="glass flex min-h-[144px] items-center justify-center rounded-xl px-xl text-center lg:min-h-[93px] lg:rounded-2xl">
        <p className="text-caption text-fg-muted">El pronóstico extendido llega pronto.</p>
      </div>
    </section>
  );
}

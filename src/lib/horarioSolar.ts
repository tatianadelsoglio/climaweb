function esInstante(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0;
}

/**
 * Amanecer y atardecer del proveedor, como segundos Unix, o null en ambos si no hay
 * un horario utilizable: OpenWeather los omite (o manda 0) durante el sol de
 * medianoche y la noche polar, y a veces los manda iguales. En ese caso el día o la
 * noche se decide por la elevación del sol (ver esDeDia).
 */
export function normalizarHorarioSolar(
  amanecer: unknown,
  atardecer: unknown,
): { amanecer: number | null; atardecer: number | null } {
  if (!esInstante(amanecer) || !esInstante(atardecer) || amanecer === atardecer) {
    return { amanecer: null, atardecer: null };
  }
  return { amanecer, atardecer };
}

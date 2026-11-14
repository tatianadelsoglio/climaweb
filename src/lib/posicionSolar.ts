import { esDeDia, segundosDelDiaLocal } from "./resolverCielo";
import type { ClimaActual } from "../types/clima";

const SEGUNDOS_POR_DIA = 86_400;

type DatosSolares = Pick<ClimaActual, "momento" | "amanecer" | "atardecer" | "zonaHoraria">;

/**
 * Cuánto del día solar pasó, de 0 (amanecer) a 1 (atardecer), con la hora
 * local de la ciudad. Usa la misma lógica de día y noche que los cielos
 * (esDeDia), así el arco y el fondo nunca se contradicen. De noche, o sin
 * amanecer y atardecer (día o noche polar), devuelve null.
 */
export function progresoSolar(datos: DatosSolares): number | null {
  const { momento, amanecer, atardecer, zonaHoraria } = datos;
  if (amanecer === null || atardecer === null || !esDeDia(datos)) return null;

  const ahora = segundosDelDiaLocal(momento, zonaHoraria);
  const inicio = segundosDelDiaLocal(amanecer, zonaHoraria);
  const fin = segundosDelDiaLocal(atardecer, zonaHoraria);

  // Módulo del día: el día solar puede cruzar la medianoche local.
  const duracion = (fin - inicio + SEGUNDOS_POR_DIA) % SEGUNDOS_POR_DIA;
  if (duracion === 0) return null;
  const transcurrido = (ahora - inicio + SEGUNDOS_POR_DIA) % SEGUNDOS_POR_DIA;
  return Math.min(Math.max(transcurrido / duracion, 0), 1);
}

/**
 * Posición del sol en la semielipse del arco, normalizada: x de 0 (izquierda)
 * a 1 (derecha) e y de 0 (horizonte) a 1 (punto más alto). Es la posición
 * sobre una elipse, no sobre una recta: sale del ángulo π·(1 − progreso).
 */
export function posicionEnArco(progreso: number): { x: number; y: number } {
  const angulo = Math.PI * (1 - progreso);
  return { x: (1 + Math.cos(angulo)) / 2, y: Math.sin(angulo) };
}

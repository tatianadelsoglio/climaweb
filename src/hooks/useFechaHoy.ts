"use client";

import { useSyncExternalStore } from "react";
import { formatearFechaLocal } from "@/lib/formatoClima";

function suscribir(): () => void {
  return () => {};
}

function fechaDelUsuario(): string {
  const ahora = new Date();
  const instante = Math.floor(ahora.getTime() / 1000);
  const zonaHoraria = -ahora.getTimezoneOffset() * 60;
  return formatearFechaLocal(instante, zonaHoraria, "larga");
}

/**
 * Fecha de hoy del usuario («Sábado 14 de noviembre»). En el servidor
 * devuelve null para no generar una diferencia de hidratación.
 */
export function useFechaHoy(): string | null {
  return useSyncExternalStore(suscribir, fechaDelUsuario, () => null);
}

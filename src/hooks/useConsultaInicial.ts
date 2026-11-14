"use client";

import { useSyncExternalStore } from "react";
import { leerAlmacenado } from "@/lib/almacenamiento";
import { CLAVE_ULTIMA_CONSULTA, leerConsultaGuardada } from "@/lib/ultimaConsulta";
import type { ConsultaClima } from "@/types/clima";

const SIN_SUSCRIPCION = () => () => {};

// Se lee una sola vez, al cargar la página: lo que se guarda después en esta
// sesión no vuelve a disparar la restauración.
let alCargar: { consulta: ConsultaClima | null } | undefined;

function leerAlCargar(): ConsultaClima | null {
  alCargar ??= { consulta: leerConsultaGuardada(leerAlmacenado(CLAVE_ULTIMA_CONSULTA)) };
  return alCargar.consulta;
}

/**
 * Última consulta guardada en localStorage, o null. En el servidor y en la
 * hidratación vale null; después pasa a la guardada sin diferencia de hidratación.
 */
export function useConsultaInicial(): ConsultaClima | null {
  return useSyncExternalStore(SIN_SUSCRIPCION, leerAlCargar, () => null);
}

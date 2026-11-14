"use client";

import { useCallback, useRef, useState } from "react";
import type { CoordenadasValidas } from "@/lib/validarBusqueda";

export type EstadoUbicacion = "inactivo" | "buscando" | "denegado" | "no-disponible";

const TIMEOUT_MS = 10_000;
// Una posición de hace menos de 5 minutos alcanza para saber en qué ciudad está.
const EDAD_MAXIMA_MS = 300_000;
const DECIMALES = 4;

function redondear(grados: number): number {
  return Number(grados.toFixed(DECIMALES));
}

/**
 * «Usar mi ubicación» con navigator.geolocation. Distingue el permiso
 * denegado de la ubicación no disponible (sin GPS o sin señal, o vencido el
 * tiempo de espera). Las coordenadas no se guardan: se entregan a `alObtener`.
 */
export function useGeolocalizacion(alObtener: (coordenadas: CoordenadasValidas) => void) {
  const [estado, setEstado] = useState<EstadoUbicacion>("inactivo");
  // Cada pedido tiene su número; cancelar() invalida el que esté en curso.
  const pedidoRef = useRef(0);

  const ubicar = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setEstado("no-disponible");
      return;
    }
    const pedido = ++pedidoRef.current;
    setEstado("buscando");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (pedido !== pedidoRef.current) return;
        setEstado("inactivo");
        alObtener({ lat: redondear(coords.latitude), lon: redondear(coords.longitude) });
      },
      (error) => {
        if (pedido !== pedidoRef.current) return;
        setEstado(error.code === error.PERMISSION_DENIED ? "denegado" : "no-disponible");
      },
      { timeout: TIMEOUT_MS, maximumAge: EDAD_MAXIMA_MS },
    );
  }, [alObtener]);

  /** Descarta el pedido en curso (la persona buscó otra cosa) y el aviso visible. */
  const cancelar = useCallback(() => {
    pedidoRef.current++;
    setEstado("inactivo");
  }, []);

  return { estado, ubicar, cancelar };
}

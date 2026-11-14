"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import type { CoordenadasValidas } from "@/lib/validarBusqueda";

/**
 * «no-soportada»: el navegador no tiene geolocalización (permanente, no se
 * puede reintentar). «no-disponible»: hay API pero esta vez no dio posición
 * (sin GPS o sin señal, tiempo agotado): es temporal y se puede reintentar.
 */
export type EstadoUbicacion =
  | "inactivo"
  | "buscando"
  | "denegado"
  | "no-disponible"
  | "no-soportada";

const SIN_SUSCRIPCION = () => () => {};

function haySoporte(): boolean {
  return Boolean(navigator.geolocation);
}

const TIMEOUT_MS = 10_000;
// Una posición de hace menos de 5 minutos alcanza para saber en qué ciudad está.
const EDAD_MAXIMA_MS = 300_000;
// 2 decimales (~1 km): alcanza para el clima de una ciudad y no deja la posición
// casi exacta en la URL (logs del hosting y del proveedor).
const DECIMALES = 2;

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
  // En el servidor se asume soporte: así la hidratación coincide y, en un navegador sin
  // geolocalización, el botón pasa a deshabilitado recién en el cliente.
  const soportada = useSyncExternalStore(SIN_SUSCRIPCION, haySoporte, () => true);
  // Cada pedido tiene su número; cancelar() invalida el que esté en curso.
  const pedidoRef = useRef(0);

  const ubicar = useCallback(() => {
    if (!haySoporte()) return;
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

  return { estado: soportada ? estado : "no-soportada", ubicar, cancelar };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClimaActual, ErrorApi } from "@/types/clima";

export type EstadoClima =
  | { estado: "inicial" }
  | { estado: "cargando" }
  | { estado: "exito"; clima: ClimaActual }
  | { estado: "error"; mensaje: string };

const MENSAJE_RED = "No se pudo conectar. Revisá tu conexión e intentá de nuevo.";

const MENSAJE_INESPERADO = "El servicio del clima no está disponible por el momento.";

function esClimaActual(datos: unknown): datos is ClimaActual {
  if (typeof datos !== "object" || datos === null) return false;
  return (
    "ciudad" in datos &&
    typeof datos.ciudad === "string" &&
    "pais" in datos &&
    typeof datos.pais === "string" &&
    "temperatura" in datos &&
    typeof datos.temperatura === "number" &&
    "temperaturaMaxima" in datos &&
    typeof datos.temperaturaMaxima === "number" &&
    "temperaturaMinima" in datos &&
    typeof datos.temperaturaMinima === "number"
  );
}

function esErrorApi(datos: unknown): datos is ErrorApi {
  if (typeof datos !== "object" || datos === null || !("error" in datos)) {
    return false;
  }
  const { error } = datos;
  return (
    typeof error === "object" &&
    error !== null &&
    "mensaje" in error &&
    typeof error.mensaje === "string"
  );
}

export function useClima() {
  const [resultado, setResultado] = useState<EstadoClima>({ estado: "inicial" });
  const controladorRef = useRef<AbortController | null>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);

  const buscar = useCallback(async (ciudad: string, pais: string) => {
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;

    setResultado({ estado: "cargando" });

    const params = new URLSearchParams({ ciudad, pais });
    try {
      const respuesta = await fetch(`/api/weather?${params.toString()}`, {
        signal: controlador.signal,
      });
      const datos: unknown = await respuesta.json().catch(() => null);
      if (controlador.signal.aborted) return;

      if (!respuesta.ok) {
        setResultado({
          estado: "error",
          mensaje: esErrorApi(datos) ? datos.error.mensaje : MENSAJE_INESPERADO,
        });
        return;
      }
      if (!esClimaActual(datos)) {
        setResultado({ estado: "error", mensaje: MENSAJE_INESPERADO });
        return;
      }
      setResultado({ estado: "exito", clima: datos });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setResultado({ estado: "error", mensaje: MENSAJE_RED });
    }
  }, []);

  return { resultado, buscar };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CIELO_ERROR_SERVICIO,
  CIELO_INICIAL,
  resolverCielo,
  type Cielo,
} from "@/lib/resolverCielo";
import type { BusquedaValida } from "@/lib/validarBusqueda";
import type { ClimaActual, CodigoError, DiaPronostico, ErrorApi } from "@/types/clima";

export type TipoError = "ciudad" | "servicio";

/** Cada estado lleva el cielo que corresponde mostrar. */
export type EstadoClima =
  | { estado: "inicial"; cielo: Cielo }
  | { estado: "cargando"; consulta: string; cielo: Cielo }
  | { estado: "exito"; clima: ClimaActual; cielo: Cielo }
  | {
      estado: "error";
      tipo: TipoError;
      consulta: string;
      mensaje: string;
      cielo: Cielo;
    };

const MENSAJE_RED = "No se pudo conectar. Revisá tu conexión e intentá de nuevo.";

const MENSAJE_INESPERADO = "El servicio del clima no está disponible por el momento.";

const CODIGOS_DE_CIUDAD: readonly CodigoError[] = [
  "CIUDAD_NO_ENCONTRADA",
  "PARAMETROS_INVALIDOS",
];

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function esNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

function esNumeroONulo(valor: unknown): valor is number | null {
  return valor === null || esNumero(valor);
}

function esDiaPronostico(dia: unknown): dia is DiaPronostico {
  return (
    esObjeto(dia) &&
    typeof dia.fecha === "string" &&
    esNumero(dia.instante) &&
    esNumero(dia.minima) &&
    esNumero(dia.maxima) &&
    esNumero(dia.codigo) &&
    esNumero(dia.probabilidadLluvia)
  );
}

function esPronosticoValido(pronostico: unknown): pronostico is DiaPronostico[] | null {
  return pronostico === null || (Array.isArray(pronostico) && pronostico.every(esDiaPronostico));
}

function esClimaActual(datos: unknown): datos is ClimaActual {
  if (!esObjeto(datos) || !esObjeto(datos.viento) || !esObjeto(datos.condicion)) {
    return false;
  }
  return (
    typeof datos.ciudad === "string" &&
    typeof datos.pais === "string" &&
    esNumero(datos.temperatura) &&
    esNumero(datos.temperaturaMaxima) &&
    esNumero(datos.temperaturaMinima) &&
    esNumero(datos.sensacionTermica) &&
    esNumero(datos.humedad) &&
    esNumero(datos.viento.velocidad) &&
    esNumeroONulo(datos.viento.direccion) &&
    esNumero(datos.condicion.codigo) &&
    esNumeroONulo(datos.amanecer) &&
    esNumeroONulo(datos.atardecer) &&
    esNumero(datos.zonaHoraria) &&
    esNumero(datos.momento) &&
    esPronosticoValido(datos.pronostico)
  );
}

function esErrorApi(datos: unknown): datos is ErrorApi {
  if (!esObjeto(datos) || !esObjeto(datos.error)) return false;
  return (
    typeof datos.error.codigo === "string" &&
    typeof datos.error.mensaje === "string"
  );
}

function estadoDeError(
  tipo: TipoError,
  consulta: string,
  mensaje: string,
): EstadoClima {
  return {
    estado: "error",
    tipo,
    consulta,
    mensaje,
    cielo: tipo === "servicio" ? CIELO_ERROR_SERVICIO : CIELO_INICIAL,
  };
}

export function useClima() {
  const [resultado, setResultado] = useState<EstadoClima>({
    estado: "inicial",
    cielo: CIELO_INICIAL,
  });
  const controladorRef = useRef<AbortController | null>(null);
  const ultimaBusquedaRef = useRef<BusquedaValida | null>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);

  const buscar = useCallback(async (busqueda: BusquedaValida) => {
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    ultimaBusquedaRef.current = busqueda;

    const { ciudad } = busqueda;
    // Mientras carga se mantiene el cielo anterior.
    setResultado((previo) => ({ estado: "cargando", consulta: ciudad, cielo: previo.cielo }));

    const params = new URLSearchParams({ ciudad });
    if (busqueda.pais) params.set("pais", busqueda.pais);

    try {
      const respuesta = await fetch(`/api/weather?${params.toString()}`, {
        signal: controlador.signal,
      });
      const datos: unknown = await respuesta.json().catch(() => null);
      if (controlador.signal.aborted) return;

      if (!respuesta.ok) {
        if (!esErrorApi(datos)) {
          setResultado(estadoDeError("servicio", ciudad, MENSAJE_INESPERADO));
          return;
        }
        const tipo = CODIGOS_DE_CIUDAD.includes(datos.error.codigo) ? "ciudad" : "servicio";
        setResultado(estadoDeError(tipo, ciudad, datos.error.mensaje));
        return;
      }
      if (!esClimaActual(datos)) {
        setResultado(estadoDeError("servicio", ciudad, MENSAJE_INESPERADO));
        return;
      }
      setResultado({ estado: "exito", clima: datos, cielo: resolverCielo(datos) });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setResultado(estadoDeError("servicio", ciudad, MENSAJE_RED));
    }
  }, []);

  const reintentar = useCallback(() => {
    if (ultimaBusquedaRef.current) void buscar(ultimaBusquedaRef.current);
  }, [buscar]);

  return { resultado, buscar, reintentar };
}

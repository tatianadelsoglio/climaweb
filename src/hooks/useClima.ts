"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CIELO_ERROR_SERVICIO,
  CIELO_INICIAL,
  resolverCielo,
  type Cielo,
} from "@/lib/resolverCielo";
import { normalizarTexto } from "@/lib/cacheProveedores";
import { formatearCoordenada } from "@/lib/coordenadas";
import { CLAVE_ULTIMA_CONSULTA, consultaParaGuardar } from "@/lib/ultimaConsulta";
import { guardarAlmacenado } from "@/lib/almacenamiento";
import type {
  ClimaActual,
  CodigoError,
  ConsultaClima,
  ConsultaCoordenadas,
  ErrorApi,
} from "@/types/clima";

function esPorCoordenadas(consulta: ConsultaClima): consulta is ConsultaCoordenadas {
  return "lat" in consulta;
}

export function etiquetaDeConsulta(consulta: ConsultaClima): string {
  return esPorCoordenadas(consulta) ? consulta.etiqueta : consulta.ciudad;
}

function parametrosDe(consulta: ConsultaClima): URLSearchParams {
  if (esPorCoordenadas(consulta)) {
    return new URLSearchParams({
      lat: formatearCoordenada(consulta.lat),
      lon: formatearCoordenada(consulta.lon),
    });
  }
  // Texto normalizado: consultas equivalentes comparten URL y, con ella, la caché del CDN.
  const params = new URLSearchParams({ ciudad: normalizarTexto(consulta.ciudad) });
  if (consulta.pais) params.set("pais", consulta.pais);
  return params;
}

/**
 * El nombre elegido (en español) pesa más que el del proveedor. Además, `momento` pasa
 * a ser la hora de este dispositivo: la respuesta puede venir de la caché del CDN
 * (hasta 10 minutos) y la hora local mostrada y el día o la noche del cielo tienen
 * que ser los de ahora.
 */
function ajustarClima(respuesta: ClimaActual, consulta: ConsultaClima): ClimaActual {
  const clima = { ...respuesta, momento: Math.floor(Date.now() / 1000) };
  if (!esPorCoordenadas(consulta)) {
    return consulta.nombre ? { ...clima, ciudad: consulta.nombre } : clima;
  }
  return {
    ...clima,
    ciudad: consulta.nombre ?? clima.ciudad,
    pais: consulta.pais ?? clima.pais,
  };
}

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

function esCoordenadas(valor: unknown): boolean {
  return esObjeto(valor) && esNumero(valor.lat) && esNumero(valor.lon);
}

function esClimaActual(datos: unknown): datos is ClimaActual {
  if (!esObjeto(datos) || !esObjeto(datos.viento) || !esObjeto(datos.condicion)) {
    return false;
  }
  return (
    typeof datos.ciudad === "string" &&
    typeof datos.pais === "string" &&
    esNumero(datos.temperatura) &&
    esNumero(datos.sensacionTermica) &&
    esNumero(datos.humedad) &&
    esNumero(datos.viento.velocidad) &&
    esNumeroONulo(datos.viento.direccion) &&
    esNumero(datos.condicion.codigo) &&
    esNumeroONulo(datos.amanecer) &&
    esNumeroONulo(datos.atardecer) &&
    esNumero(datos.zonaHoraria) &&
    esNumero(datos.momento) &&
    esCoordenadas(datos.coordenadas)
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
  const ultimaConsultaRef = useRef<ConsultaClima | null>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);

  const buscar = useCallback(async (consulta: ConsultaClima) => {
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    ultimaConsultaRef.current = consulta;

    const etiqueta = etiquetaDeConsulta(consulta);
    // Mientras carga se mantiene el cielo anterior.
    setResultado((previo) => ({ estado: "cargando", consulta: etiqueta, cielo: previo.cielo }));

    try {
      const respuesta = await fetch(`/api/weather?${parametrosDe(consulta).toString()}`, {
        signal: controlador.signal,
      });
      const datos: unknown = await respuesta.json().catch(() => null);
      if (controlador.signal.aborted) return;

      if (!respuesta.ok) {
        if (!esErrorApi(datos)) {
          setResultado(estadoDeError("servicio", etiqueta, MENSAJE_INESPERADO));
          return;
        }
        const tipo = CODIGOS_DE_CIUDAD.includes(datos.error.codigo) ? "ciudad" : "servicio";
        setResultado(estadoDeError(tipo, etiqueta, datos.error.mensaje));
        return;
      }
      if (!esClimaActual(datos)) {
        setResultado(estadoDeError("servicio", etiqueta, MENSAJE_INESPERADO));
        return;
      }
      const clima = ajustarClima(datos, consulta);
      const guardable = consultaParaGuardar(consulta, clima);
      if (guardable) guardarAlmacenado(CLAVE_ULTIMA_CONSULTA, JSON.stringify(guardable));
      setResultado({ estado: "exito", clima, cielo: resolverCielo(clima) });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setResultado(estadoDeError("servicio", etiqueta, MENSAJE_RED));
    }
  }, []);

  const reintentar = useCallback(() => {
    if (ultimaConsultaRef.current) void buscar(ultimaConsultaRef.current);
  }, [buscar]);

  return { resultado, buscar, reintentar };
}

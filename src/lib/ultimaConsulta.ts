// Imports relativos: este módulo también corre en el runner de tests de Node, sin alias.
import { nombrePais } from "./formatoClima.ts";
import { validarBusqueda } from "./validarBusqueda.ts";
import type { ConsultaClima } from "../types/clima.ts";

export const CLAVE_ULTIMA_CONSULTA = "atmosfera:ultima-consulta";
const NOMBRE_MAX = 100;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function esCoordenada(valor: unknown, limite: number): valor is number {
  return typeof valor === "number" && Number.isFinite(valor) && Math.abs(valor) <= limite;
}

/**
 * Qué guardar de una consulta exitosa. La ubicación del dispositivo no se
 * guarda como coordenadas: se guarda la ciudad que resultó, que es más gruesa
 * y no delata dónde está la persona. Devuelve null si no hay nada válido que
 * guardar.
 */
export function consultaParaGuardar(
  consulta: ConsultaClima,
  clima: { ciudad: string; pais: string },
): ConsultaClima | null {
  if ("lat" in consulta && consulta.nombre === undefined) {
    const validacion = validarBusqueda(clima.ciudad, clima.pais);
    return validacion.valida ? validacion.datos : null;
  }
  return consulta;
}

/** Lee lo guardado y descarta cualquier cosa que no tenga la forma esperada. */
export function leerConsultaGuardada(texto: string | null): ConsultaClima | null {
  if (texto === null) return null;
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!esObjeto(datos)) return null;

  if ("lat" in datos) {
    const { lat, lon, etiqueta, nombre, pais } = datos;
    if (
      !esCoordenada(lat, 90) ||
      !esCoordenada(lon, 180) ||
      typeof etiqueta !== "string" ||
      typeof nombre !== "string" ||
      (pais !== undefined && typeof pais !== "string")
    ) {
      return null;
    }
    return { lat, lon, etiqueta, nombre, ...(pais !== undefined && { pais }) };
  }

  const ciudad = typeof datos.ciudad === "string" ? datos.ciudad : null;
  const pais = typeof datos.pais === "string" ? datos.pais : null;
  const validacion = validarBusqueda(ciudad, pais);
  if (!validacion.valida) return null;
  const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
  return nombre !== "" && nombre.length <= NOMBRE_MAX
    ? { ...validacion.datos, nombre }
    : validacion.datos;
}

/** Lo que se muestra en el buscador al restaurar: «Córdoba, Argentina». */
export function textoDeConsulta(consulta: ConsultaClima): string {
  if ("lat" in consulta) {
    return consulta.pais ? `${consulta.etiqueta}, ${nombrePais(consulta.pais)}` : consulta.etiqueta;
  }
  const ciudad = consulta.nombre ?? consulta.ciudad;
  return consulta.pais ? `${ciudad}, ${consulta.pais}` : ciudad;
}

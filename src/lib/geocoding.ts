// Import relativo: este módulo también corre en el runner de tests de Node, sin alias.
import type { Sugerencia } from "../types/geocoding.ts";

/** Mínimo de caracteres de la ciudad para pedir sugerencias (cliente y servidor). */
export const MINIMO_CARACTERES = 2;
export const LIMITE_SUGERENCIAS = 5;
export const DEMORA_SUGERENCIAS_MS = 300;

function esNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function textoNoVacio(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
}

/** Un resultado de Open-Meteo (con language=es el nombre ya viene en español). */
function sugerenciaDeOpenMeteo(item: unknown): Sugerencia | null {
  if (!esObjeto(item)) return null;
  const nombre = textoNoVacio(item.name);
  const pais = textoNoVacio(item.country_code);
  if (
    !nombre ||
    !pais ||
    !/^[A-Za-z]{2}$/.test(pais) ||
    !esNumero(item.latitude) ||
    !esNumero(item.longitude) ||
    Math.abs(item.latitude) > 90 ||
    Math.abs(item.longitude) > 180
  ) {
    return null;
  }
  return {
    nombre,
    estado: textoNoVacio(item.admin1),
    pais: pais.toUpperCase(),
    lat: item.latitude,
    lon: item.longitude,
  };
}

/**
 * Sugerencias que corresponden a la búsqueda actual (`clave`): las de una
 * búsqueda anterior, o las que quedaron de un texto que ya cambió, no valen.
 */
export function sugerenciasVigentes(
  respuesta: { clave: string; sugerencias: Sugerencia[] } | null,
  clave: string | null,
): Sugerencia[] {
  return clave !== null && respuesta?.clave === clave ? respuesta.sugerencias : [];
}

/**
 * Respuesta de /v1/search de Open-Meteo → sugerencias. Descarta los elementos
 * inválidos y los repetidos (mismo nombre, estado y país, o mismas coordenadas)
 * y respeta el límite. Sin resultados, Open-Meteo omite `results`.
 */
export function normalizarGeocoding(datos: unknown): Sugerencia[] {
  if (!esObjeto(datos) || !Array.isArray(datos.results)) return [];
  const vistas = new Set<string>();
  const sugerencias: Sugerencia[] = [];
  for (const item of datos.results as unknown[]) {
    const sugerencia = sugerenciaDeOpenMeteo(item);
    if (!sugerencia) continue;
    const claves = [
      [sugerencia.nombre, sugerencia.estado ?? "", sugerencia.pais].join("|").toLocaleLowerCase("es"),
      `${sugerencia.lat},${sugerencia.lon}`,
    ];
    if (claves.some((clave) => vistas.has(clave))) continue;
    claves.forEach((clave) => vistas.add(clave));
    sugerencias.push(sugerencia);
    if (sugerencias.length === LIMITE_SUGERENCIAS) break;
  }
  return sugerencias;
}

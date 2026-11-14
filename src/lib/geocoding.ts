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

function sugerenciaDeOpenWeather(item: unknown): Sugerencia | null {
  if (!esObjeto(item)) return null;
  const original = textoNoVacio(item.name);
  const pais = textoNoVacio(item.country);
  if (
    !original ||
    !pais ||
    !/^[A-Za-z]{2}$/.test(pais) ||
    !esNumero(item.lat) ||
    !esNumero(item.lon) ||
    Math.abs(item.lat) > 90 ||
    Math.abs(item.lon) > 180
  ) {
    return null;
  }
  const nombres = esObjeto(item.local_names) ? item.local_names : null;
  return {
    nombre: textoNoVacio(nombres?.es) ?? original,
    estado: textoNoVacio(item.state),
    pais: pais.toUpperCase(),
    lat: item.lat,
    lon: item.lon,
  };
}

/**
 * Respuesta de /geo/1.0/direct → sugerencias. Descarta los elementos inválidos
 * y los repetidos (mismo nombre, estado y país, o mismas coordenadas: la API
 * a veces devuelve el mismo lugar dos veces, también con otro nombre) y
 * respeta el límite.
 */
export function normalizarGeocoding(datos: unknown): Sugerencia[] {
  if (!Array.isArray(datos)) return [];
  const vistas = new Set<string>();
  const sugerencias: Sugerencia[] = [];
  for (const item of datos as unknown[]) {
    const sugerencia = sugerenciaDeOpenWeather(item);
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

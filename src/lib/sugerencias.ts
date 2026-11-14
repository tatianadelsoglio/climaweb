// Import relativo: este módulo también corre en el runner de tests de Node, sin alias.
import { nombrePais } from "./formatoClima.ts";
import type { Sugerencia } from "../types/geocoding.ts";

function sinTildes(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
}

/**
 * Separa el nombre en la parte que coincide con lo escrito (se muestra en
 * negrita) y el resto. Compara sin tildes ni mayúsculas, así «Cord» marca
 * «Cord» de «Córdoba» y también de «Cordova». Si el nombre no empieza con
 * lo escrito, no hay coincidencia.
 */
export function dividirCoincidencia(
  nombre: string,
  escrito: string,
): { coincide: string; resto: string } {
  const buscado = sinTildes(escrito.trim());
  if (buscado === "") return { coincide: "", resto: nombre };

  let acumulado = "";
  let largo = 0;
  for (const caracter of nombre) {
    if (acumulado.length >= buscado.length) break;
    acumulado += sinTildes(caracter);
    largo += caracter.length;
  }
  return acumulado === buscado
    ? { coincide: nombre.slice(0, largo), resto: nombre.slice(largo) }
    : { coincide: "", resto: nombre };
}

/** «Córdoba, Argentina»: provincia o estado y país, sin el nombre del lugar. */
export function regionSugerencia({ estado, pais }: Sugerencia): string {
  return [estado, nombrePais(pais)].filter(Boolean).join(", ");
}

/** Texto que queda en el buscador al elegir: «Córdoba, Córdoba, Argentina». */
export function textoSugerencia(sugerencia: Sugerencia): string {
  return `${sugerencia.nombre}, ${regionSugerencia(sugerencia)}`;
}

/**
 * Etiqueta corta de cada sugerencia: «Córdoba, Argentina». Si dos comparten
 * nombre y país, se agrega el estado para distinguirlas.
 */
export function etiquetasCortas(sugerencias: Sugerencia[]): string[] {
  const cortas = sugerencias.map((s) => `${s.nombre}, ${nombrePais(s.pais)}`);
  return sugerencias.map((s, i) =>
    cortas.filter((c) => c === cortas[i]).length > 1 ? textoSugerencia(s) : cortas[i],
  );
}

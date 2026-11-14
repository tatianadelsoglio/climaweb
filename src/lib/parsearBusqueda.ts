import { validarBusqueda, type BusquedaValida } from "./validarBusqueda";

export interface BusquedaTexto {
  ciudad: string;
  /** Código ISO de 2 letras, si se reconoció un país. */
  pais?: string;
}

const CODIGO_PAIS = /^[A-Za-z]{2}$/;
const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .trim();
}

let paisesPorNombre: Map<string, string> | null = null;

/** Nombre del país en español (sin tildes) → código ISO, a partir de Intl. */
function obtenerPaisesPorNombre(): Map<string, string> {
  if (paisesPorNombre) return paisesPorNombre;
  const nombres = new Intl.DisplayNames(["es"], { type: "region", fallback: "none" });
  const mapa = new Map<string, string>();
  for (const a of LETRAS) {
    for (const b of LETRAS) {
      const codigo = a + b;
      const nombre = nombres.of(codigo);
      if (nombre) mapa.set(normalizar(nombre), codigo);
    }
  }
  paisesPorNombre = mapa;
  return mapa;
}

/**
 * Separa el texto del buscador en ciudad y país: «Córdoba», «Córdoba, AR» o
 * «Córdoba, Argentina». Si el último tramo no es un país reconocible, todo el
 * texto se toma como ciudad (y la validación lo rechazará si tiene comas).
 */
export function parsearBusqueda(texto: string): BusquedaTexto {
  const limpio = texto.trim();
  const coma = limpio.lastIndexOf(",");
  if (coma === -1) return { ciudad: limpio };

  const ciudad = limpio.slice(0, coma).trim();
  const ultimo = limpio.slice(coma + 1).trim();
  if (ciudad === "") return { ciudad: limpio };

  if (CODIGO_PAIS.test(ultimo)) return { ciudad, pais: ultimo.toUpperCase() };

  const pais = obtenerPaisesPorNombre().get(normalizar(ultimo));
  return pais ? { ciudad, pais } : { ciudad: limpio };
}

export const MENSAJE_BUSQUEDA_VACIA = "Escribí el nombre de una ciudad.";
export const MENSAJE_BUSQUEDA_INVALIDA =
  "Escribí la ciudad y, si querés, el país: «Córdoba, AR».";

/** Texto del buscador → búsqueda válida o mensaje para mostrar en el campo. */
export function interpretarBusqueda(
  texto: string,
): { valida: true; datos: BusquedaValida } | { valida: false; mensaje: string } {
  const { ciudad, pais } = parsearBusqueda(texto);
  if (ciudad === "") return { valida: false, mensaje: MENSAJE_BUSQUEDA_VACIA };
  const validacion = validarBusqueda(ciudad, pais ?? null);
  return validacion.valida
    ? validacion
    : { valida: false, mensaje: MENSAJE_BUSQUEDA_INVALIDA };
}

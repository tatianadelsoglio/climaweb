export interface BusquedaValida {
  ciudad: string;
  /** Código ISO de 2 letras; opcional. */
  pais?: string;
}

const CIUDAD_MAX = 100;
// Letras (con acentos), espacios, apóstrofes, puntos y guiones.
const CIUDAD_REGEX = /^[\p{L}][\p{L}' .-]*$/u;
const PAIS_REGEX = /^[A-Za-z]{2}$/;

/** Devuelve la búsqueda normalizada o un mensaje de error. */
export function validarBusqueda(
  ciudad: string | null,
  pais: string | null,
): { valida: true; datos: BusquedaValida } | { valida: false; mensaje: string } {
  const ciudadLimpia = ciudad?.trim() ?? "";
  const paisLimpio = pais?.trim() ?? "";

  if (ciudadLimpia === "") {
    return { valida: false, mensaje: "El parámetro ciudad es obligatorio." };
  }
  if (ciudadLimpia.length > CIUDAD_MAX || !CIUDAD_REGEX.test(ciudadLimpia)) {
    return { valida: false, mensaje: "El parámetro ciudad no es válido." };
  }
  if (paisLimpio === "") {
    return { valida: true, datos: { ciudad: ciudadLimpia } };
  }
  if (!PAIS_REGEX.test(paisLimpio)) {
    return {
      valida: false,
      mensaje: "El parámetro pais debe ser un código de 2 letras (ej: AR).",
    };
  }

  return {
    valida: true,
    datos: { ciudad: ciudadLimpia, pais: paisLimpio.toUpperCase() },
  };
}

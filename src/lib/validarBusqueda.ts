export interface BusquedaValida {
  ciudad: string;
  pais: string;
}

const CIUDAD_MAX = 100;
// Letras (con acentos), espacios, apóstrofes, puntos y guiones.
const CIUDAD_REGEX = /^[\p{L}][\p{L}\s'.-]*$/u;
const PAIS_REGEX = /^[A-Za-z]{2}$/;

/** Devuelve la búsqueda normalizada o un mensaje de error. */
export function validarBusqueda(
  ciudad: string | null,
  pais: string | null,
): { valida: true; datos: BusquedaValida } | { valida: false; mensaje: string } {
  const ciudadLimpia = ciudad?.trim() ?? "";
  const paisLimpio = pais?.trim() ?? "";

  if (ciudadLimpia === "" || paisLimpio === "") {
    return { valida: false, mensaje: "Los parámetros ciudad y pais son obligatorios." };
  }
  if (ciudadLimpia.length > CIUDAD_MAX || !CIUDAD_REGEX.test(ciudadLimpia)) {
    return { valida: false, mensaje: "El parámetro ciudad no es válido." };
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

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

export interface CoordenadasValidas {
  lat: number;
  lon: number;
}

function numeroDecimal(texto: string | null): number | null {
  const limpio = texto?.trim() ?? "";
  if (limpio === "" || !/^-?\d+(\.\d+)?$/.test(limpio)) return null;
  return Number(limpio);
}

/** Valida latitud (−90 a 90) y longitud (−180 a 180) recibidas como texto. */
export function validarCoordenadas(
  lat: string | null,
  lon: string | null,
): { valida: true; datos: CoordenadasValidas } | { valida: false; mensaje: string } {
  const latitud = numeroDecimal(lat);
  const longitud = numeroDecimal(lon);
  if (latitud === null || longitud === null) {
    return { valida: false, mensaje: "Los parámetros lat y lon son obligatorios y numéricos." };
  }
  if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
    return { valida: false, mensaje: "Las coordenadas están fuera de rango." };
  }
  return { valida: true, datos: { lat: latitud, lon: longitud } };
}

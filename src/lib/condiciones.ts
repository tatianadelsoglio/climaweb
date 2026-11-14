/**
 * Descripciones propias de las condiciones de OpenWeather. No se muestra el
 * campo `description` del proveedor: sus traducciones al español suenan raras
 * («muy nuboso»).
 */
const DESCRIPCIONES: Readonly<Record<number, string>> = {
  // 2xx · tormenta
  200: "Tormenta con lluvia leve",
  201: "Tormenta con lluvia",
  202: "Tormenta con lluvia fuerte",
  210: "Tormenta leve",
  211: "Tormenta",
  212: "Tormenta fuerte",
  221: "Tormenta irregular",
  230: "Tormenta con llovizna leve",
  231: "Tormenta con llovizna",
  232: "Tormenta con llovizna fuerte",
  // 3xx · llovizna
  300: "Llovizna leve",
  301: "Llovizna",
  302: "Llovizna intensa",
  310: "Llovizna con lluvia leve",
  311: "Llovizna con lluvia",
  312: "Llovizna con lluvia intensa",
  313: "Chubascos con llovizna",
  314: "Chubascos fuertes con llovizna",
  321: "Llovizna en chubascos",
  // 5xx · lluvia
  500: "Lluvia leve",
  501: "Lluvia moderada",
  502: "Lluvia intensa",
  503: "Lluvia muy intensa",
  504: "Lluvia extrema",
  511: "Lluvia helada",
  520: "Chubascos leves",
  521: "Chubascos",
  522: "Chubascos intensos",
  531: "Chubascos irregulares",
  // 6xx · nieve
  600: "Nevada leve",
  601: "Nevada",
  602: "Nevada intensa",
  611: "Aguanieve",
  612: "Aguanieve leve",
  613: "Chubascos de aguanieve",
  615: "Lluvia leve con nieve",
  616: "Lluvia con nieve",
  620: "Chubascos de nieve leves",
  621: "Chubascos de nieve",
  622: "Chubascos de nieve intensos",
  // 7xx · atmósfera
  701: "Neblina",
  711: "Humo",
  721: "Bruma",
  731: "Remolinos de polvo",
  741: "Niebla",
  751: "Arena en el aire",
  761: "Polvo en el aire",
  762: "Ceniza volcánica",
  771: "Ráfagas de viento",
  781: "Tornado",
  // 800 y 80x · cielo despejado y nubes
  800: "Despejado",
  801: "Pocas nubes",
  802: "Parcialmente nublado",
  803: "Mayormente nublado",
  804: "Nublado",
};

const DESCRIPCION_POR_GRUPO: Readonly<Record<number, string>> = {
  2: "Tormenta",
  3: "Llovizna",
  5: "Lluvia",
  6: "Nieve",
  7: "Visibilidad reducida",
  8: "Cielo variable",
};

const DESCRIPCION_DESCONOCIDA = "Condición no disponible";

/** 802 → "Parcialmente nublado". Un código desconocido cae en la descripción de su grupo. */
export function descripcionCondicion(codigo: number): string {
  return (
    DESCRIPCIONES[codigo] ??
    DESCRIPCION_POR_GRUPO[Math.floor(codigo / 100)] ??
    DESCRIPCION_DESCONOCIDA
  );
}

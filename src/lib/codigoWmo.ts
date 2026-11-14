/**
 * Códigos del tiempo de la OMM (WMO) que usa Open-Meteo → códigos de condición
 * de OpenWeather. Así el pronóstico reutiliza las mismas descripciones propias
 * (condiciones.ts) y los mismos íconos que el clima actual.
 *
 * Open-Meteo no distingue «pocas nubes» de «parcialmente nublado» por
 * porcentaje: 1 es «mayormente despejado» (801), 2 «parcialmente nublado» (802)
 * y 3 «cubierto» (804).
 */
const WMO_A_OPENWEATHER: Readonly<Record<number, number>> = {
  0: 800,
  1: 801,
  2: 802,
  3: 804,
  45: 741, // niebla
  48: 741, // niebla con escarcha
  51: 300, // llovizna leve
  53: 301,
  55: 302,
  56: 511, // llovizna helada
  57: 511,
  61: 500, // lluvia leve
  63: 501,
  65: 502,
  66: 511, // lluvia helada
  67: 511,
  71: 600, // nevada leve
  73: 601,
  75: 602,
  77: 600, // granos de nieve
  80: 520, // chubascos leves
  81: 521,
  82: 522,
  85: 620, // chubascos de nieve leves
  86: 621,
  95: 211, // tormenta
  96: 212, // tormenta con granizo
  99: 212,
};

/** Código de condición de OpenWeather equivalente, o null si el WMO no se conoce. */
export function condicionDeWmo(codigoWmo: number): number | null {
  return WMO_A_OPENWEATHER[codigoWmo] ?? null;
}

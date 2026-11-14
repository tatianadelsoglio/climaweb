/** Un día del pronóstico, agrupado por día local de la ciudad. Celsius. */
export interface DiaPronostico {
  /** Día local de la ciudad, «2026-11-15». */
  fecha: string;
  /** Instante de la franja del mediodía (representa al día y da su fecha local). */
  instante: number;
  minima: number;
  maxima: number;
  /** Código de condición de OpenWeather del mediodía. */
  codigo: number;
  /** De 0 a 100: la mayor del día. */
  probabilidadLluvia: number;
}

/** Clima actual normalizado: grados Celsius, km/h y tiempos en segundos Unix (UTC). */
export interface ClimaActual {
  ciudad: string;
  pais: string;
  temperatura: number;
  /** Máxima y mínima de hoy (día local), calculadas con el pronóstico y la temperatura actual. */
  temperaturaMaxima: number;
  temperaturaMinima: number;
  sensacionTermica: number;
  /** Porcentaje de 0 a 100. */
  humedad: number;
  viento: {
    velocidad: number;
    /** Grados meteorológicos (0 = norte); null si el proveedor no lo informa. */
    direccion: number | null;
  };
  condicion: {
    /** Código de condición de OpenWeather (2xx, 3xx, 5xx, 6xx, 7xx, 800, 80x). */
    codigo: number;
  };
  /** null cuando no hay amanecer/atardecer (día o noche polar). */
  amanecer: number | null;
  atardecer: number | null;
  /** Desplazamiento del huso horario de la ciudad respecto de UTC, en segundos. */
  zonaHoraria: number;
  /** Instante de la consulta. */
  momento: number;
  /** Probabilidad de lluvia de hoy, de 0 a 100; null sin pronóstico. */
  probabilidadLluvia: number | null;
  /** Próximos días; null si el pronóstico no pudo obtenerse (el clima actual sigue valiendo). */
  pronostico: DiaPronostico[] | null;
}

export type CodigoError =
  | "PARAMETROS_INVALIDOS"
  | "CIUDAD_NO_ENCONTRADA"
  | "SERVICIO_NO_CONFIGURADO"
  | "LIMITE_DE_CONSULTAS"
  | "SERVICIO_NO_DISPONIBLE"
  | "RESPUESTA_INVALIDA";

export interface ErrorApi {
  error: {
    codigo: CodigoError;
    mensaje: string;
  };
}

export type RespuestaClima = ClimaActual | ErrorApi;

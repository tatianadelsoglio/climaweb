/** Clima actual normalizado: grados Celsius, km/h y tiempos en segundos Unix (UTC). */
export interface ClimaActual {
  ciudad: string;
  pais: string;
  temperatura: number;
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
    descripcion: string;
  };
  /** null cuando no hay amanecer/atardecer (día o noche polar). */
  amanecer: number | null;
  atardecer: number | null;
  /** Desplazamiento del huso horario de la ciudad respecto de UTC, en segundos. */
  zonaHoraria: number;
  /** Instante de la consulta. */
  momento: number;
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

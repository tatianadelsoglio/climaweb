/** Clima actual normalizado, en grados Celsius. */
export interface ClimaActual {
  ciudad: string;
  pais: string;
  temperatura: number;
  temperaturaMaxima: number;
  temperaturaMinima: number;
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

import type { BusquedaValida, CoordenadasValidas } from "@/lib/validarBusqueda";

/** Consulta por coordenadas: autocompletado o geolocalización. */
export interface ConsultaCoordenadas extends CoordenadasValidas {
  /** Cómo se nombra la consulta mientras carga o si falla («tu ubicación»). */
  etiqueta: string;
  /** Nombre en español elegido por la persona; reemplaza al que informa el clima. */
  nombre?: string;
  /** Código ISO del país elegido; reemplaza al que informa el clima. */
  pais?: string;
}

/** Consulta por ciudad; `nombre` es cómo se la muestra («Tokio», no el «Tokyo» del proveedor). */
export interface ConsultaCiudad extends BusquedaValida {
  nombre?: string;
}

export type ConsultaClima = ConsultaCiudad | ConsultaCoordenadas;

/** Un día del pronóstico (día completo, en el huso de la ciudad). Celsius. */
export interface DiaPronostico {
  /** Día local de la ciudad, «2026-11-15». */
  fecha: string;
  /** Mínima y máxima de todo el día, incluidas las horas que ya pasaron. */
  minima: number;
  maxima: number;
  /** Código de condición equivalente de OpenWeather (los de Open-Meteo se traducen). */
  codigo: number;
  /** Probabilidad máxima de lluvia del día, de 0 a 100; null si el proveedor no la informa. */
  probabilidadLluvia: number | null;
}

/** Respuesta de /api/forecast: hoy y los 6 días siguientes, en ese orden. */
export interface RespuestaPronostico {
  dias: DiaPronostico[];
}

/** Clima actual normalizado: grados Celsius, km/h y tiempos en segundos Unix (UTC). */
export interface ClimaActual {
  ciudad: string;
  pais: string;
  temperatura: number;
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
  /** Ubicación que resolvió el proveedor: con ella se pide el pronóstico. */
  coordenadas: CoordenadasValidas;
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

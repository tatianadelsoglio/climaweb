/** Lugar encontrado por la Geocoding API, normalizado. */
export interface Sugerencia {
  /** Nombre en español si existe (local_names.es); si no, el original. */
  nombre: string;
  /** Provincia o estado, si el lugar lo tiene. */
  estado: string | null;
  /** Código ISO de 2 letras. */
  pais: string;
  lat: number;
  lon: number;
}

export interface RespuestaGeocoding {
  sugerencias: Sugerencia[];
}

const A_RADIANES = Math.PI / 180;
const MS_POR_DIA = 86_400_000;

/**
 * Elevación del sol sobre el horizonte, en grados, para un instante y un lugar.
 *
 * Aproximación astronómica sencilla (declinación de Cooper y ecuación del tiempo de
 * Spencer): error de unos 0,5° a 1°, de sobra para decidir entre día y noche. Se usa
 * cuando el proveedor no informa amanecer y atardecer (sol de medianoche y noche
 * polar) o los informa iguales.
 *
 * @param instante segundos Unix (UTC)
 * @param lat latitud en grados (norte positivo)
 * @param lon longitud en grados (este positivo)
 */
export function elevacionSolar(instante: number, lat: number, lon: number): number {
  const fecha = new Date(instante * 1000);
  const inicioDelAnio = Date.UTC(fecha.getUTCFullYear(), 0, 0);
  const diaDelAnio = Math.floor((instante * 1000 - inicioDelAnio) / MS_POR_DIA);

  const declinacion =
    23.45 * Math.sin(((360 / 365) * (284 + diaDelAnio)) * A_RADIANES) * A_RADIANES;

  // Ecuación del tiempo, en minutos.
  const b = ((360 / 364) * (diaDelAnio - 81)) * A_RADIANES;
  const ecuacionDelTiempo = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

  const horasUtc = fecha.getUTCHours() + fecha.getUTCMinutes() / 60 + fecha.getUTCSeconds() / 3600;
  const horaSolar = horasUtc + lon / 15 + ecuacionDelTiempo / 60;
  const anguloHorario = 15 * (horaSolar - 12) * A_RADIANES;

  const latitud = lat * A_RADIANES;
  const seno =
    Math.sin(latitud) * Math.sin(declinacion) +
    Math.cos(latitud) * Math.cos(declinacion) * Math.cos(anguloHorario);
  return Math.asin(Math.min(1, Math.max(-1, seno))) / A_RADIANES;
}

/**
 * Elevación bajo la cual es de noche: el borde superior del sol toca el horizonte
 * (−0,833°: radio solar más refracción atmosférica), la misma definición del
 * amanecer y el atardecer oficiales.
 */
export const ELEVACION_DE_HORIZONTE = -0.833;

/** Día o noche según la elevación del sol en ese instante y lugar. */
export function esDeDiaPorElevacion(instante: number, lat: number, lon: number): boolean {
  return elevacionSolar(instante, lat, lon) > ELEVACION_DE_HORIZONTE;
}

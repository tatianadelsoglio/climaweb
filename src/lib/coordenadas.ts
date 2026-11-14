// 2 decimales (~1 km): alcanza para el clima de una ciudad y hace que ubicaciones
// cercanas compartan la misma URL (y, con ella, la misma entrada de caché).
const DECIMALES_URL = 2;

/**
 * Latitud o longitud como texto decimal para una URL: nunca en notación
 * científica («1e-8») y redondeada a 2 decimales.
 */
export function formatearCoordenada(grados: number): string {
  const texto = grados.toFixed(DECIMALES_URL);
  // Evita «-0.00» para valores negativos que redondean a cero.
  return Number(texto) === 0 ? (0).toFixed(DECIMALES_URL) : texto;
}

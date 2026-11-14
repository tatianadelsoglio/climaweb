/*
 * DECISIÓN ACEPTADA: las coordenadas se redondean a 2 decimales (~1,1 km) en TODA URL
 * hacia nuestras rutas y hacia los proveedores (clima y pronóstico por ubicación).
 * Consecuencias:
 *  - Dos puntos a menos de ~1 km reciben la misma respuesta. Para el clima de una
 *    ciudad es irrelevante (los modelos del pronóstico tienen celdas de varios km).
 *  - Ubicaciones cercanas comparten URL y, con ella, la entrada de caché del CDN y de
 *    Next: es lo que hace que la caché realmente acierte.
 *  - La ubicación exacta de la persona no viaja ni queda en los logs (privacidad).
 * Si algún día hiciera falta más precisión, cambiar solo esta constante.
 */
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

const DECIMALES_URL = 4;

/**
 * Latitud o longitud como texto decimal para una URL: nunca en notación
 * científica («1e-8») y con 4 decimales (~11 m), de sobra para el clima.
 */
export function formatearCoordenada(grados: number): string {
  const texto = grados.toFixed(DECIMALES_URL);
  // Evita «-0.0000» para valores negativos que redondean a cero.
  return Number(texto) === 0 ? (0).toFixed(DECIMALES_URL) : texto;
}

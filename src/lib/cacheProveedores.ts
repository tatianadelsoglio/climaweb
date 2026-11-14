/**
 * Caché de las llamadas a los proveedores, en dos niveles con el mismo TTL:
 *
 * 1. Servidor: `fetch(..., { next: { revalidate } })` usa la caché de datos de Next
 *    (en Vercel es compartida entre instancias). La clave es la URL del proveedor,
 *    por eso las URL se arman con entradas normalizadas (texto en minúsculas y sin
 *    espacios de más, coordenadas redondeadas): consultas equivalentes dan la misma
 *    clave y aciertan.
 * 2. CDN: `Cache-Control` con `s-maxage` + `stale-while-revalidate` en nuestras rutas.
 *
 * Esta caché es la protección principal contra el agotamiento de cuota de los
 * proveedores; el límite por IP (limitarPeticiones.ts) es solo un complemento.
 */

/** Segundos de vida por tipo de dato. */
export const TTL = {
  /** Clima actual: cambia poco en 10 minutos. */
  clima: 10 * 60,
  /** Pronóstico diario: se recalcula unas pocas veces por hora. */
  pronostico: 30 * 60,
  /** Geocodificación: los lugares casi no cambian. */
  geocoding: 24 * 60 * 60,
} as const;

/** Opciones de fetch para que Next cachee la respuesta del proveedor `ttl` segundos. */
export function opcionesDeCache(ttl: number): { next: { revalidate: number } } {
  return { next: { revalidate: ttl } };
}

/**
 * `Cache-Control` para el CDN: fresco `ttl` segundos y, vencido, se sirve el viejo
 * mientras se revalida en segundo plano durante la mitad del TTL. Sin `max-age`:
 * el navegador siempre consulta al CDN, que es quien absorbe los pedidos.
 */
export function cabeceraCacheCdn(ttl: number): string {
  return `public, s-maxage=${ttl}, stale-while-revalidate=${Math.round(ttl / 2)}`;
}

/** Texto de búsqueda como clave: sin espacios de más y en minúsculas. */
export function normalizarTexto(texto: string): string {
  return texto.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

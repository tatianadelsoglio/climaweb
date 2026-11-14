import { AlmacenEnMemoria, type AlmacenLimite } from "@/lib/rateLimit";

/** Almacén en memoria (por instancia; ver rateLimit.ts). Se exporta tipado para las pruebas. */
export const almacenEnMemoria = new AlmacenEnMemoria();

/**
 * ÚNICO lugar donde se elige el almacén del límite. Para pasar a uno externo
 * (por ejemplo, Upstash), implementar `AlmacenLimite` y reemplazar esta línea.
 */
export const almacenLimite: AlmacenLimite = almacenEnMemoria;

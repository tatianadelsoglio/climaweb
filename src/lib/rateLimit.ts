/**
 * Límite de pedidos por clave (en la práctica, por IP) con cubo de fichas.
 *
 * Cada clave tiene un cubo con `capacidad` fichas que se rellena a
 * `fichasPorSegundo`. Cada pedido gasta una; sin fichas, se rechaza y se informa en
 * cuántos segundos habrá una. Permite ráfagas (la capacidad) pero acota el ritmo
 * sostenido.
 *
 * IMPORTANTE: `AlmacenEnMemoria` guarda el estado en la memoria del proceso. En
 * serverless (Vercel) cada instancia tiene su propio estado y se descarta cuando la
 * instancia se apaga: el límite es POR INSTANCIA y de mejor esfuerzo, no global. La
 * protección principal de la cuota de los proveedores es la caché
 * (cacheProveedores.ts); esto solo frena abusos evidentes desde una misma IP.
 *
 * Para un límite global (por ejemplo, con Upstash/Redis) basta implementar
 * `AlmacenLimite` y cambiar UNA línea en almacenLimite.ts: las rutas no se tocan.
 */

export interface ConfigLimite {
  /** Pedidos que se admiten de golpe (tamaño del cubo). */
  capacidad: number;
  /** Ritmo sostenido: fichas que se recuperan por segundo. */
  fichasPorSegundo: number;
}

export interface ResultadoLimite {
  permitido: boolean;
  /** Segundos hasta que haya una ficha; 0 si el pedido se admitió. */
  reintentarEnSegundos: number;
}

/** Contrato que implementa cualquier almacén (memoria, Redis, Upstash, etc.). */
export interface AlmacenLimite {
  consumir(
    clave: string,
    config: ConfigLimite,
    ahoraMs: number,
  ): ResultadoLimite | Promise<ResultadoLimite>;
}

/**
 * Estado de un cubo. Guarda su propia configuración: el almacén es único y mezcla
 * claves de rutas con límites distintos, y el barrido tiene que juzgar a cada cubo con
 * la suya, no con la de la ruta que casualmente lo dispara.
 */
interface Cubo extends ConfigLimite {
  fichas: number;
  ultimoMs: number;
}

/** Tope de claves en memoria; al pasarlo se descartan las menos recientes. */
export const MAX_CLAVES = 10_000;
const BARRIDO_CADA = 500;

export class AlmacenEnMemoria implements AlmacenLimite {
  private readonly cubos = new Map<string, Cubo>();
  private llamadas = 0;

  consumir(clave: string, config: ConfigLimite, ahoraMs: number): ResultadoLimite {
    if (++this.llamadas % BARRIDO_CADA === 0) this.barrer(ahoraMs);

    const previo = this.cubos.get(clave);
    const transcurridoS = previo ? Math.max(0, (ahoraMs - previo.ultimoMs) / 1000) : 0;
    const fichas = previo
      ? Math.min(config.capacidad, previo.fichas + transcurridoS * config.fichasPorSegundo)
      : config.capacidad;

    // El tiempo del cubo nunca retrocede: si el reloj se atrasó, se conserva el último
    // instante visto, así el relleno posterior no cuenta segundos que no pasaron.
    const ultimoMs = previo ? Math.max(previo.ultimoMs, ahoraMs) : ahoraMs;

    // Reinsertar mueve la clave al final: el orden del Map es el de uso reciente.
    this.cubos.delete(clave);
    if (fichas >= 1) {
      this.cubos.set(clave, { ...config, fichas: fichas - 1, ultimoMs });
      this.acotar();
      return { permitido: true, reintentarEnSegundos: 0 };
    }
    this.cubos.set(clave, { ...config, fichas, ultimoMs });
    this.acotar();
    return {
      permitido: false,
      reintentarEnSegundos: Math.max(1, Math.ceil((1 - fichas) / config.fichasPorSegundo)),
    };
  }

  /** Descarta los cubos que ya se rellenaron del todo (con SU capacidad y ritmo): equivalen a no tener estado. */
  private barrer(ahoraMs: number): void {
    for (const [clave, cubo] of this.cubos) {
      const rellenoS = Math.max(0, (ahoraMs - cubo.ultimoMs) / 1000);
      if (cubo.fichas + rellenoS * cubo.fichasPorSegundo >= cubo.capacidad) {
        this.cubos.delete(clave);
      }
    }
  }

  /** Tope de memoria: si hay demasiadas claves, se descartan las menos recientes. */
  private acotar(): void {
    while (this.cubos.size > MAX_CLAVES) {
      const masVieja = this.cubos.keys().next().value;
      if (masVieja === undefined) break;
      this.cubos.delete(masVieja);
    }
  }

  /** Cantidad de claves en memoria (para pruebas y diagnóstico). */
  get tamano(): number {
    return this.cubos.size;
  }

  /** Vacía el estado (para pruebas). */
  reiniciar(): void {
    this.cubos.clear();
    this.llamadas = 0;
  }
}

import { useState } from "react";
import type { EstadoClima } from "@/hooks/useClima";
import type { EstadoUbicacion } from "@/hooks/useGeolocalizacion";
import { descripcionCondicion } from "@/lib/condiciones";
import { formatearTemperatura, nombrePais } from "@/lib/formatoClima";
import type { Unidad } from "@/lib/unidades";

interface AnuncioEstadoProps {
  resultado: EstadoClima;
  unidad: Unidad;
  estadoUbicacion: EstadoUbicacion;
  /**
   * El foco ya se lleva al título (h1) del resultado, y el lector lo lee solo:
   * se anuncia únicamente lo que el título no dice, para no repetirlo.
   */
  resumido: boolean;
}

/** Qué anunciar para este estado. Ver `AnuncioEstadoProps.resumido`. */
export function textoAnuncio(
  resultado: EstadoClima,
  unidad: Unidad,
  estadoUbicacion: EstadoUbicacion,
  resumido: boolean,
): string {
  if (estadoUbicacion === "buscando") return "Buscando tu ubicación…";

  switch (resultado.estado) {
    case "inicial":
      return "";
    case "cargando":
      return `Buscando el clima de ${resultado.consulta}…`;
    case "exito": {
      const { clima } = resultado;
      const datos = `${formatearTemperatura(clima.temperatura, unidad)}, ${descripcionCondicion(clima.condicion.codigo)}.`;
      // El título enfocado ya dice «Ciudad, País».
      return resumido ? datos : `${clima.ciudad}, ${nombrePais(clima.pais)}: ${datos}`;
    }
    case "error":
      // El título de «sin resultados» ya dice qué pasó; el de falla del servicio no dice el motivo.
      return resumido && resultado.tipo === "ciudad" ? "" : resultado.mensaje;
  }
}

/**
 * Región aria-live única que anuncia cada cambio de estado de la búsqueda.
 *
 * El texto se calcula UNA vez por cambio de estado y no se recalcula al cambiar la
 * unidad (°C/°F): ese botón ya anuncia su propio estado, y repetir el clima completo
 * en cada cambio sería ruido.
 */
export default function AnuncioEstado({
  resultado,
  unidad,
  estadoUbicacion,
  resumido,
}: AnuncioEstadoProps) {
  const buscandoUbicacion = estadoUbicacion === "buscando";
  const [previo, setPrevio] = useState<{ resultado: EstadoClima; buscando: boolean } | null>(null);
  const [texto, setTexto] = useState("");

  // Ajuste de estado durante el render (patrón de React): se recalcula solo si cambió
  // el estado de la búsqueda o de la ubicación, no la unidad.
  if (previo?.resultado !== resultado || previo?.buscando !== buscandoUbicacion) {
    setPrevio({ resultado, buscando: buscandoUbicacion });
    setTexto(textoAnuncio(resultado, unidad, estadoUbicacion, resumido));
  }

  return (
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {texto}
    </p>
  );
}

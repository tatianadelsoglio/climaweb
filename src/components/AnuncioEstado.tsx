import { useState } from "react";
import type { EstadoClima } from "@/hooks/useClima";
import type { EstadoFoco } from "@/hooks/useFocoEnContenido";
import type { EstadoUbicacion } from "@/hooks/useGeolocalizacion";
import { descripcionCondicion } from "@/lib/condiciones";
import { formatearTemperatura, nombrePais } from "@/lib/formatoClima";
import type { Unidad } from "@/lib/unidades";

interface AnuncioEstadoProps {
  resultado: EstadoClima;
  unidad: Unidad;
  estadoUbicacion: EstadoUbicacion;
  /**
   * Qué pasó con el foco en esta búsqueda. Con el foco en el título (h1) del
   * resultado, el lector lo lee solo y se anuncia únicamente lo que el título no dice.
   */
  foco: EstadoFoco;
}

/**
 * Qué anunciar para este estado. Ver `AnuncioEstadoProps.foco`.
 *
 * Si el foco va a ir al título pero todavía no llegó ("esperando"), el resultado final
 * no se anuncia todavía: se anuncia cuando se sabe dónde quedó el foco, para no decir
 * la ciudad dos veces ni dejar en silencio a quien movió el foco durante la carga.
 */
export function textoAnuncio(
  resultado: EstadoClima,
  unidad: Unidad,
  estadoUbicacion: EstadoUbicacion,
  foco: EstadoFoco,
): string {
  if (estadoUbicacion === "buscando") return "Buscando tu ubicación…";
  const resumido = foco === "titulo";
  const final = resultado.estado === "exito" || resultado.estado === "error";
  if (final && foco === "esperando") return "";

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
  foco,
}: AnuncioEstadoProps) {
  const buscandoUbicacion = estadoUbicacion === "buscando";
  const [previo, setPrevio] = useState<{
    resultado: EstadoClima;
    buscando: boolean;
    foco: EstadoFoco;
  } | null>(null);
  const [texto, setTexto] = useState("");

  // Ajuste de estado durante el render (patrón de React): se recalcula solo si cambió
  // el estado de la búsqueda, de la ubicación o del foco, no la unidad.
  if (
    previo?.resultado !== resultado ||
    previo?.buscando !== buscandoUbicacion ||
    previo?.foco !== foco
  ) {
    setPrevio({ resultado, buscando: buscandoUbicacion, foco });
    setTexto(textoAnuncio(resultado, unidad, estadoUbicacion, foco));
  }

  return (
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {texto}
    </p>
  );
}

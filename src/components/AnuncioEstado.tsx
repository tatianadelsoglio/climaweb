import type { EstadoClima } from "@/hooks/useClima";
import { descripcionCondicion } from "@/lib/condiciones";
import { formatearTemperatura, nombrePais } from "@/lib/formatoClima";
import type { Unidad } from "@/lib/unidades";

interface AnuncioEstadoProps {
  resultado: EstadoClima;
  unidad: Unidad;
}

function textoAnuncio(resultado: EstadoClima, unidad: Unidad): string {
  switch (resultado.estado) {
    case "inicial":
      return "";
    case "cargando":
      return `Buscando el clima de ${resultado.consulta}…`;
    case "exito": {
      const { clima } = resultado;
      return `${clima.ciudad}, ${nombrePais(clima.pais)}: ${formatearTemperatura(clima.temperatura, unidad)}, ${descripcionCondicion(clima.condicion.codigo)}.`;
    }
    case "error":
      return resultado.mensaje;
  }
}

/** Región aria-live única que anuncia cada cambio de estado de la búsqueda. */
export default function AnuncioEstado({ resultado, unidad }: AnuncioEstadoProps) {
  return (
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {textoAnuncio(resultado, unidad)}
    </p>
  );
}

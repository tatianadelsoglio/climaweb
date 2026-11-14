import type { EstadoClima } from "@/hooks/useClima";
import { descripcionCondicion } from "@/lib/condiciones";
import { formatearTemperatura, nombrePais } from "@/lib/formatoClima";

interface AnuncioEstadoProps {
  resultado: EstadoClima;
}

function textoAnuncio(resultado: EstadoClima): string {
  switch (resultado.estado) {
    case "inicial":
      return "";
    case "cargando":
      return `Buscando el clima de ${resultado.consulta}…`;
    case "exito": {
      const { clima } = resultado;
      return `${clima.ciudad}, ${nombrePais(clima.pais)}: ${formatearTemperatura(clima.temperatura)}, ${descripcionCondicion(clima.condicion.codigo)}.`;
    }
    case "error":
      return resultado.mensaje;
  }
}

/** Región aria-live única que anuncia cada cambio de estado de la búsqueda. */
export default function AnuncioEstado({ resultado }: AnuncioEstadoProps) {
  return (
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {textoAnuncio(resultado)}
    </p>
  );
}

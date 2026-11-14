"use client";

import Clima from "@/components/Clima";
import Formulario from "@/components/Formulario";
import MensajeError from "@/components/MensajeError";
import { useClima } from "@/hooks/useClima";

export default function BuscadorClima() {
  const { resultado, buscar } = useClima();

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 md:grid-cols-2">
      <Formulario cargando={resultado.estado === "cargando"} onBuscar={buscar} />

      <div aria-live="polite">
        {resultado.estado === "inicial" && (
          <p className="text-center text-white">
            Elegí una ciudad y un país para ver el clima.
          </p>
        )}
        {resultado.estado === "cargando" && (
          <p className="text-center text-white">Consultando el clima...</p>
        )}
        {resultado.estado === "error" && (
          <MensajeError mensaje={resultado.mensaje} />
        )}
        {resultado.estado === "exito" && <Clima clima={resultado.clima} />}
      </div>
    </div>
  );
}

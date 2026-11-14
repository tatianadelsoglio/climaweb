"use client";

import { useState } from "react";
import AnuncioEstado from "@/components/AnuncioEstado";
import CampoBusqueda from "@/components/CampoBusqueda";
import Encabezado from "@/components/Encabezado";
import PantallaCargando from "@/components/PantallaCargando";
import PantallaError from "@/components/PantallaError";
import PantallaInicial, { type CiudadSugerida } from "@/components/PantallaInicial";
import PantallaResultado from "@/components/PantallaResultado";
import { useCieloDocumento } from "@/hooks/useCieloDocumento";
import { useClima } from "@/hooks/useClima";
import { useFocoEnContenido } from "@/hooks/useFocoEnContenido";
import { interpretarBusqueda } from "@/lib/parsearBusqueda";

export default function AppClima() {
  const { resultado, buscar, reintentar } = useClima();
  const [texto, setTexto] = useState("");
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  useCieloDocumento(resultado.cielo);
  const { contenedorRef, llevarFocoAlContenido } = useFocoEnContenido(
    resultado.estado,
    resultado.estado === "exito" || resultado.estado === "error",
  );

  function cambiarTexto(valor: string) {
    setTexto(valor);
    setErrorCampo(null);
  }

  function buscarTexto() {
    const busqueda = interpretarBusqueda(texto);
    if (!busqueda.valida) {
      setErrorCampo(busqueda.mensaje);
      return;
    }
    setErrorCampo(null);
    void buscar(busqueda.datos);
  }

  function elegirCiudad({ nombre, busqueda }: CiudadSugerida) {
    cambiarTexto(nombre);
    llevarFocoAlContenido();
    void buscar(busqueda);
  }

  function reintentarBusqueda() {
    llevarFocoAlContenido();
    reintentar();
  }

  const ciudadInexistente = resultado.estado === "error" && resultado.tipo === "ciudad";

  return (
    <div
      data-sky={resultado.cielo}
      className="relative isolate flex min-h-dvh flex-1 flex-col overflow-x-clip bg-cielo"
    >
      <Encabezado
        buscador={
          <CampoBusqueda
            valor={texto}
            mensajeError={errorCampo}
            invalido={errorCampo !== null || ciudadInexistente}
            onCambiar={cambiarTexto}
            onBuscar={buscarTexto}
          />
        }
      />

      <main ref={contenedorRef} tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {resultado.estado === "inicial" && <PantallaInicial onElegirCiudad={elegirCiudad} />}
        {resultado.estado === "cargando" && <PantallaCargando consulta={resultado.consulta} />}
        {resultado.estado === "exito" && (
          <PantallaResultado clima={resultado.clima} cielo={resultado.cielo} />
        )}
        {resultado.estado === "error" && (
          <PantallaError
            tipo={resultado.tipo}
            consulta={resultado.consulta}
            onReintentar={reintentarBusqueda}
          />
        )}
      </main>

      <AnuncioEstado resultado={resultado} />
    </div>
  );
}

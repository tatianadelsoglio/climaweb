"use client";

import { useRef, useState } from "react";
import AnuncioEstado from "@/components/AnuncioEstado";
import CampoBusqueda from "@/components/CampoBusqueda";
import Encabezado from "@/components/Encabezado";
import PantallaCargando from "@/components/PantallaCargando";
import PantallaError from "@/components/PantallaError";
import PantallaInicial, { type CiudadSugerida } from "@/components/PantallaInicial";
import PantallaResultado from "@/components/PantallaResultado";
import { useAutocompletado } from "@/hooks/useAutocompletado";
import { useCieloDocumento } from "@/hooks/useCieloDocumento";
import { useClima, type ConsultaCoordenadas } from "@/hooks/useClima";
import { useFocoEnContenido } from "@/hooks/useFocoEnContenido";
import { useSugerencias } from "@/hooks/useSugerencias";
import { useUnidad } from "@/hooks/useUnidad";
import { interpretarBusqueda } from "@/lib/parsearBusqueda";
import { textoSugerencia } from "@/lib/sugerencias";
import type { Sugerencia } from "@/types/geocoding";

function consultaDeSugerencia(sugerencia: Sugerencia): ConsultaCoordenadas {
  return {
    lat: sugerencia.lat,
    lon: sugerencia.lon,
    etiqueta: sugerencia.nombre,
    nombre: sugerencia.nombre,
    pais: sugerencia.pais,
  };
}

export default function AppClima() {
  const { resultado, buscar, reintentar } = useClima();
  const [unidad, setUnidad] = useUnidad();
  const [texto, setTexto] = useState("");
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  // Sugerencia elegida y el texto que dejó en el campo: si se vuelve a buscar con
  // ese mismo texto (que no es una búsqueda válida por sí solo) se usa la elegida.
  const seleccionRef = useRef<{ texto: string; consulta: ConsultaCoordenadas } | null>(null);
  const autocompletado = useAutocompletado(texto);
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
    autocompletado.cerrar();
    const seleccion = seleccionRef.current;
    if (seleccion && seleccion.texto === texto) {
      setErrorCampo(null);
      void buscar(seleccion.consulta);
      return;
    }
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

  function elegirSugerencia(sugerencia: Sugerencia) {
    const consulta = consultaDeSugerencia(sugerencia);
    const textoElegido = textoSugerencia(sugerencia);
    seleccionRef.current = { texto: textoElegido, consulta };
    cambiarTexto(textoElegido);
    autocompletado.cerrar();
    llevarFocoAlContenido();
    void buscar(consulta);
  }

  function reintentarBusqueda() {
    llevarFocoAlContenido();
    reintentar();
  }

  const ciudadInexistente = resultado.estado === "error" && resultado.tipo === "ciudad";
  // «¿Quisiste decir…?»: lugares parecidos a la ciudad que no se encontró.
  const { sugerencias: alternativas } = useSugerencias(
    ciudadInexistente ? { ciudad: resultado.consulta } : null,
    0,
  );

  return (
    <div
      data-sky={resultado.cielo}
      className="relative isolate flex min-h-dvh flex-1 flex-col overflow-x-clip bg-cielo"
    >
      <Encabezado
        unidad={unidad}
        onCambiarUnidad={setUnidad}
        buscador={
          <CampoBusqueda
            valor={texto}
            mensajeError={errorCampo}
            invalido={errorCampo !== null || ciudadInexistente}
            onCambiar={(valor) => {
              cambiarTexto(valor);
              autocompletado.abrir();
            }}
            onBuscar={buscarTexto}
            autocompletado={autocompletado}
            onElegirSugerencia={elegirSugerencia}
          />
        }
      />

      <main ref={contenedorRef} tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {resultado.estado === "inicial" && <PantallaInicial onElegirCiudad={elegirCiudad} />}
        {resultado.estado === "cargando" && <PantallaCargando consulta={resultado.consulta} />}
        {resultado.estado === "exito" && (
          <PantallaResultado clima={resultado.clima} cielo={resultado.cielo} unidad={unidad} />
        )}
        {resultado.estado === "error" && (
          <PantallaError
            tipo={resultado.tipo}
            consulta={resultado.consulta}
            alternativas={alternativas}
            onElegirAlternativa={elegirSugerencia}
            onReintentar={reintentarBusqueda}
          />
        )}
      </main>

      <AnuncioEstado resultado={resultado} unidad={unidad} />
    </div>
  );
}

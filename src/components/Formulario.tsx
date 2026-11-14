"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import MensajeError from "@/components/MensajeError";

const PAISES = [
  { codigo: "US", nombre: "Estados Unidos" },
  { codigo: "MX", nombre: "México" },
  { codigo: "AR", nombre: "Argentina" },
  { codigo: "CO", nombre: "Colombia" },
  { codigo: "CR", nombre: "Costa Rica" },
  { codigo: "ES", nombre: "España" },
  { codigo: "PE", nombre: "Perú" },
] as const;

interface FormularioProps {
  cargando: boolean;
  onBuscar: (ciudad: string, pais: string) => void;
}

const CLASE_CAMPO =
  "w-full rounded border border-white bg-transparent px-3 py-2 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white";

export default function Formulario({ cargando, onBuscar }: FormularioProps) {
  const [ciudad, setCiudad] = useState("");
  const [pais, setPais] = useState("");
  const [error, setError] = useState(false);

  function handleCiudad(e: ChangeEvent<HTMLInputElement>) {
    setCiudad(e.target.value);
  }

  function handlePais(e: ChangeEvent<HTMLSelectElement>) {
    setPais(e.target.value);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (ciudad.trim() === "" || pais === "") {
      setError(true);
      return;
    }
    setError(false);
    onBuscar(ciudad.trim(), pais);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <MensajeError mensaje="Ambos campos son obligatorios" />}

      <div className="flex flex-col gap-1">
        <label htmlFor="ciudad" className="text-white">
          Ciudad
        </label>
        <input
          type="text"
          id="ciudad"
          name="ciudad"
          value={ciudad}
          onChange={handleCiudad}
          maxLength={100}
          autoComplete="off"
          className={CLASE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="pais" className="text-white">
          País
        </label>
        <select
          id="pais"
          name="pais"
          value={pais}
          onChange={handlePais}
          className={`${CLASE_CAMPO} [&>option]:text-slate-900`}
        >
          <option value="">-- Seleccione un país --</option>
          {PAISES.map(({ codigo, nombre }) => (
            <option key={codigo} value={codigo}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={cargando}
        className="rounded bg-yellow-400 px-4 py-3 text-lg font-semibold text-slate-900 transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cargando ? "Buscando..." : "Buscar clima"}
      </button>
    </form>
  );
}

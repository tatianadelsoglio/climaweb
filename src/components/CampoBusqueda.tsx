"use client";

import { Search, X } from "lucide-react";
import { useRef, type FormEvent } from "react";

interface CampoBusquedaProps {
  valor: string;
  /** Mensaje de validación del propio campo. */
  mensajeError: string | null;
  /** Borde de error (también cuando la ciudad no existe). */
  invalido: boolean;
  onCambiar: (valor: string) => void;
  onBuscar: () => void;
}

const ID_CAMPO = "busqueda-ciudad";
const ID_ERROR = "busqueda-ciudad-error";

export default function CampoBusqueda({
  valor,
  mensajeError,
  invalido,
  onCambiar,
  onBuscar,
}: CampoBusquedaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onBuscar();
  }

  function limpiar() {
    onCambiar("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col lg:relative lg:w-[560px] lg:flex-initial">
      <form
        role="search"
        noValidate
        onSubmit={handleSubmit}
        className={`glass-strong flex h-[52px] items-center gap-field rounded-pill pr-2xs pl-chip has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-(--spacing-toggle) has-[input:focus-visible]:outline-focus lg:h-control lg:gap-md lg:pr-xs lg:pl-xl ${
          invalido ? "[--glass-borde-ancho:2px] [--glass-borde-color:var(--color-danger)]" : ""
        }`}
      >
        <Search aria-hidden className="size-5 shrink-0" />
        <label htmlFor={ID_CAMPO} className="sr-only">
          Buscar ciudad
        </label>
        <input
          ref={inputRef}
          id={ID_CAMPO}
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          maxLength={120}
          placeholder="Buscá una ciudad…"
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          aria-invalid={invalido}
          aria-describedby={mensajeError ? ID_ERROR : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-muted"
        />
        {valor !== "" && (
          <button
            type="button"
            onClick={limpiar}
            aria-label="Borrar búsqueda"
            className="flex size-11 shrink-0 items-center justify-center rounded-pill"
          >
            <X aria-hidden className="size-[18px] text-fg-muted" />
          </button>
        )}
      </form>
      {mensajeError && (
        <p
          id={ID_ERROR}
          className="pt-xs pl-chip text-caption text-danger lg:absolute lg:top-full lg:pl-xl"
        >
          {mensajeError}
        </p>
      )}
    </div>
  );
}

// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { EstadoClima } from "@/hooks/useClima";
import type { ClimaActual } from "@/types/clima";
import AnuncioEstado, { textoAnuncio } from "./AnuncioEstado";

const CLIMA: ClimaActual = {
  ciudad: "Madrid",
  pais: "ES",
  temperatura: 12,
  sensacionTermica: 11,
  humedad: 80,
  viento: { velocidad: 10, direccion: 240 },
  condicion: { codigo: 803 },
  amanecer: null,
  atardecer: null,
  zonaHoraria: 3600,
  momento: 1,
  coordenadas: { lat: 40.4, lon: -3.7 },
};

const EXITO: EstadoClima = { estado: "exito", clima: CLIMA, cielo: "clouds-day" };
const ERROR_CIUDAD: EstadoClima = {
  estado: "error",
  tipo: "ciudad",
  consulta: "Xyz",
  mensaje: "No se encontró la ciudad indicada.",
  cielo: "clear-day",
};
const ERROR_SERVICIO: EstadoClima = {
  estado: "error",
  tipo: "servicio",
  consulta: "Madrid",
  mensaje: "No se pudo conectar. Revisá tu conexión e intentá de nuevo.",
  cielo: "rain",
};

afterEach(cleanup);

describe("textoAnuncio", () => {
  it("no anuncia nada en el estado inicial", () => {
    expect(textoAnuncio({ estado: "inicial", cielo: "clear-day" }, "C", "inactivo", false)).toBe("");
  });

  it("anuncia la búsqueda en curso", () => {
    const cargando: EstadoClima = { estado: "cargando", consulta: "Madrid", cielo: "clear-day" };
    expect(textoAnuncio(cargando, "C", "inactivo", false)).toBe("Buscando el clima de Madrid…");
  });

  it("resultado completo: ciudad, país, temperatura y condición", () => {
    expect(textoAnuncio(EXITO, "C", "inactivo", false)).toBe(
      "Madrid, España: 12°, Mayormente nublado.",
    );
  });

  it("con el foco en el título, el resultado no repite la ciudad (el título la lee)", () => {
    expect(textoAnuncio(EXITO, "C", "inactivo", true)).toBe("12°, Mayormente nublado.");
  });

  it("usa la unidad elegida", () => {
    expect(textoAnuncio(EXITO, "F", "inactivo", true)).toBe("54°, Mayormente nublado.");
  });

  it("ciudad inexistente: con el foco en el título no se repite; sin foco se anuncia el mensaje", () => {
    expect(textoAnuncio(ERROR_CIUDAD, "C", "inactivo", true)).toBe("");
    expect(textoAnuncio(ERROR_CIUDAD, "C", "inactivo", false)).toBe(ERROR_CIUDAD.mensaje);
  });

  it("falla del servicio: el título no dice el motivo, así que siempre se anuncia", () => {
    expect(textoAnuncio(ERROR_SERVICIO, "C", "inactivo", true)).toBe(ERROR_SERVICIO.mensaje);
    expect(textoAnuncio(ERROR_SERVICIO, "C", "inactivo", false)).toBe(ERROR_SERVICIO.mensaje);
  });

  it("mientras busca la ubicación, lo anuncia", () => {
    expect(textoAnuncio({ estado: "inicial", cielo: "clear-day" }, "C", "buscando", false)).toBe(
      "Buscando tu ubicación…",
    );
  });
});

describe("AnuncioEstado (región aria-live)", () => {
  it("es una única región status, polite y atómica", () => {
    render(<AnuncioEstado resultado={EXITO} unidad="C" estadoUbicacion="inactivo" resumido={false} />);
    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.getAttribute("aria-atomic")).toBe("true");
    expect(region.textContent).toBe("Madrid, España: 12°, Mayormente nublado.");
  });

  it("cambiar de °C a °F NO vuelve a anunciar el clima (el botón ya anuncia su estado)", () => {
    const { rerender } = render(
      <AnuncioEstado resultado={EXITO} unidad="C" estadoUbicacion="inactivo" resumido={false} />,
    );
    const antes = screen.getByRole("status").textContent;
    rerender(<AnuncioEstado resultado={EXITO} unidad="F" estadoUbicacion="inactivo" resumido={false} />);
    expect(screen.getByRole("status").textContent).toBe(antes);
  });

  it("al llegar un resultado nuevo, el anuncio se actualiza (con la unidad de ese momento)", () => {
    const { rerender } = render(
      <AnuncioEstado resultado={EXITO} unidad="F" estadoUbicacion="inactivo" resumido={true} />,
    );
    expect(screen.getByRole("status").textContent).toBe("54°, Mayormente nublado.");

    const otro: EstadoClima = {
      estado: "exito",
      clima: { ...CLIMA, ciudad: "Tokio", pais: "JP", temperatura: 20 },
      cielo: "clear-day",
    };
    rerender(<AnuncioEstado resultado={otro} unidad="F" estadoUbicacion="inactivo" resumido={true} />);
    expect(screen.getByRole("status").textContent).toBe("68°, Mayormente nublado.");
  });

  it("buscar la ubicación se anuncia y, al terminar, vuelve el estado de la búsqueda", () => {
    const { rerender } = render(
      <AnuncioEstado
        resultado={{ estado: "inicial", cielo: "clear-day" }}
        unidad="C"
        estadoUbicacion="buscando"
        resumido={false}
      />,
    );
    expect(screen.getByRole("status").textContent).toBe("Buscando tu ubicación…");
    const cargando: EstadoClima = { estado: "cargando", consulta: "tu ubicación", cielo: "clear-day" };
    rerender(
      <AnuncioEstado resultado={cargando} unidad="C" estadoUbicacion="inactivo" resumido={false} />,
    );
    expect(screen.getByRole("status").textContent).toBe("Buscando el clima de tu ubicación…");
  });
});

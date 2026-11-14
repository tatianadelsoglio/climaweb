// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchControlable } from "@/test/fetchControlable";
import { respuestaJson } from "@/test/rutas";
import type { ClimaActual } from "@/types/clima";
import AppClima from "./AppClima";

// next/image necesita la configuración de Next; acá alcanza con una imagen común.
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const CLIMA: ClimaActual = {
  ciudad: "Madrid",
  pais: "ES",
  temperatura: 12,
  sensacionTermica: 11,
  humedad: 80,
  viento: { velocidad: 10, direccion: 240 },
  condicion: { codigo: 803 },
  // Sin horario solar: no se dibuja el arco (jsdom no tiene ResizeObserver).
  amanecer: null,
  atardecer: null,
  zonaHoraria: 3600,
  momento: 1,
  coordenadas: { lat: 40.42, lon: -3.7 },
};

const ANUNCIO_COMPLETO = "Madrid, España: 12°, Mayormente nublado.";
const ANUNCIO_RESUMIDO = "12°, Mayormente nublado.";

function anuncio(): string {
  const region = document.querySelector('[role="status"][aria-atomic="true"]');
  return region?.textContent ?? "";
}

function titulo(): HTMLElement {
  return screen.getByRole("heading", { level: 1 });
}

function clicEnChip(nombre: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(nombre) }));
}

/** Resuelve el pedido pendiente a /api/weather con lo indicado. */
async function resolverClima(
  pendientes: ReturnType<typeof fetchControlable>["pendientes"],
  respuesta: Response,
) {
  const pedido = pendientes.find((p) => p.url.startsWith("/api/weather"));
  if (!pedido) throw new Error("no hay un pedido pendiente a /api/weather");
  await act(async () => pedido.resolver(respuesta));
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(cleanup);

describe("AppClima · foco y anuncios (sin duplicados)", () => {
  it("chip: el foco va al título y se anuncia solo lo que el título no dice", async () => {
    const { pendientes } = fetchControlable();
    render(<AppClima />);

    clicEnChip("Madrid");
    expect(anuncio()).toBe("Buscando el clima de Madrid…");

    await resolverClima(pendientes, respuestaJson(CLIMA));
    await waitFor(() => expect(titulo().textContent).toContain("Madrid"));

    expect(document.activeElement).toBe(titulo());
    expect(anuncio()).toBe(ANUNCIO_RESUMIDO); // sin repetir «Madrid, España»
  });

  it("chip, pero la persona mueve el foco al buscador mientras carga: se anuncia TODO, con la ciudad", async () => {
    const { pendientes } = fetchControlable();
    render(<AppClima />);

    clicEnChip("Madrid");
    const campo = screen.getByRole("combobox");
    campo.focus();

    await resolverClima(pendientes, respuestaJson(CLIMA));
    await waitFor(() => expect(titulo().textContent).toContain("Madrid"));

    expect(document.activeElement).toBe(campo); // se respeta el foco de la persona
    expect(anuncio()).toBe(ANUNCIO_COMPLETO);
  });

  it("mientras espera el resultado no anuncia nada de más (ni se queda mudo después)", async () => {
    const { pendientes } = fetchControlable();
    render(<AppClima />);
    clicEnChip("Madrid");
    expect(anuncio()).toBe("Buscando el clima de Madrid…");
    await resolverClima(pendientes, respuestaJson(CLIMA));
    await waitFor(() => expect(anuncio()).not.toBe("Buscando el clima de Madrid…"));
    expect(anuncio()).not.toBe("");
  });

  it("búsqueda escrita + Enter: el foco queda en el campo y se anuncia el resultado completo", async () => {
    const { pendientes } = fetchControlable();
    render(<AppClima />);

    const campo = screen.getByRole("combobox");
    campo.focus();
    fireEvent.change(campo, { target: { value: "Madrid, ES" } });
    fireEvent.submit(screen.getByRole("search"));

    await resolverClima(pendientes, respuestaJson(CLIMA));
    await waitFor(() => expect(titulo().textContent).toContain("Madrid"));

    expect(document.activeElement).toBe(campo);
    expect(anuncio()).toBe(ANUNCIO_COMPLETO);
  });

  it("ciudad inexistente con el foco en el título: el título lo dice y no se repite el mensaje", async () => {
    const { pendientes } = fetchControlable();
    render(<AppClima />);

    clicEnChip("Madrid");
    await resolverClima(
      pendientes,
      respuestaJson(
        { error: { codigo: "CIUDAD_NO_ENCONTRADA", mensaje: "No se encontró la ciudad indicada." } },
        404,
      ),
    );
    await waitFor(() => expect(titulo().textContent).toContain("No encontramos"));

    expect(document.activeElement).toBe(titulo());
    expect(anuncio()).toBe("");
  });

  it("ciudad inexistente pero con el foco movido: SÍ se anuncia el error", async () => {
    const { pendientes } = fetchControlable();
    render(<AppClima />);

    clicEnChip("Madrid");
    screen.getByRole("combobox").focus();
    await resolverClima(
      pendientes,
      respuestaJson(
        { error: { codigo: "CIUDAD_NO_ENCONTRADA", mensaje: "No se encontró la ciudad indicada." } },
        404,
      ),
    );
    await waitFor(() => expect(titulo().textContent).toContain("No encontramos"));

    expect(document.activeElement).toBe(screen.getByRole("combobox"));
    expect(anuncio()).toBe("No se encontró la ciudad indicada.");
  });

  it("falla del servicio: el título no dice el motivo, así que se anuncia aunque el foco esté en él", async () => {
    const { pendientes } = fetchControlable();
    render(<AppClima />);

    clicEnChip("Madrid");
    await resolverClima(
      pendientes,
      respuestaJson(
        { error: { codigo: "SERVICIO_NO_DISPONIBLE", mensaje: "El servicio no está disponible." } },
        502,
      ),
    );
    await waitFor(() => expect(titulo().textContent).toContain("servicio"));

    expect(document.activeElement).toBe(titulo());
    expect(anuncio()).toBe("El servicio no está disponible.");
  });

  it("cambiar °C/°F no reanuncia el clima", async () => {
    const { pendientes } = fetchControlable();
    render(<AppClima />);
    clicEnChip("Madrid");
    await resolverClima(pendientes, respuestaJson(CLIMA));
    await waitFor(() => expect(titulo().textContent).toContain("Madrid"));
    const antes = anuncio();

    fireEvent.click(screen.getByRole("button", { name: "°F" }));
    expect(anuncio()).toBe(antes);
    expect(screen.getByRole("button", { name: "°F" }).getAttribute("aria-pressed")).toBe("true");

    // useUnidad guarda la elección a nivel de módulo: se deja como estaba para los demás tests.
    fireEvent.click(screen.getByRole("button", { name: "°C" }));
  });

  it("una búsqueda escrita después de una por chip vuelve a anunciar completo", async () => {
    const { pendientes } = fetchControlable();
    render(<AppClima />);

    clicEnChip("Madrid");
    await resolverClima(pendientes, respuestaJson(CLIMA));
    await waitFor(() => expect(anuncio()).toBe(ANUNCIO_RESUMIDO));

    const campo = screen.getByRole("combobox");
    campo.focus();
    fireEvent.change(campo, { target: { value: "Tokio, JP" } });
    fireEvent.submit(screen.getByRole("search"));
    const pedidoTokio = pendientes.filter((p) => p.url.startsWith("/api/weather")).at(-1);
    await act(async () =>
      pedidoTokio?.resolver(respuestaJson({ ...CLIMA, ciudad: "Tokio", pais: "JP", temperatura: 20 })),
    );
    await waitFor(() => expect(anuncio()).toContain("Tokio, Japón"));
    expect(anuncio()).toBe("Tokio, Japón: 20°, Mayormente nublado.");
  });
});

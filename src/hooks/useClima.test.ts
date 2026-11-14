// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchControlable } from "@/test/fetchControlable";
import { respuestaJson } from "@/test/rutas";
import type { ClimaActual } from "@/types/clima";
import { useClima } from "./useClima";

function clima(extra: Partial<ClimaActual> = {}): ClimaActual {
  return {
    ciudad: "Madrid",
    pais: "ES",
    temperatura: 12,
    sensacionTermica: 11,
    humedad: 80,
    viento: { velocidad: 10, direccion: 240 },
    condicion: { codigo: 800 },
    amanecer: Date.UTC(2026, 10, 14, 7, 0) / 1000,
    atardecer: Date.UTC(2026, 10, 14, 17, 0) / 1000,
    zonaHoraria: 3600,
    momento: 1,
    coordenadas: { lat: 40.42, lon: -3.7 },
    ...extra,
  };
}

function errorApi(codigo: string, mensaje: string) {
  return { error: { codigo, mensaje } };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useClima · flujo básico", () => {
  it("arranca en estado inicial con el cielo inicial", () => {
    fetchControlable();
    const { result } = renderHook(() => useClima());
    expect(result.current.resultado).toMatchObject({ estado: "inicial", cielo: "clear-day" });
  });

  it("buscar pasa a cargando con la etiqueta de la consulta y luego a éxito", async () => {
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useClima());

    act(() => {
      void result.current.buscar({ ciudad: "Madrid", pais: "ES" });
    });
    expect(result.current.resultado).toMatchObject({ estado: "cargando", consulta: "Madrid" });

    await act(async () => pendientes[0].resolver(respuestaJson(clima())));
    await waitFor(() => expect(result.current.resultado.estado).toBe("exito"));
    expect(result.current.resultado).toMatchObject({
      estado: "exito",
      clima: { ciudad: "Madrid" },
      cielo: expect.stringMatching(/^(clear|clouds)-(day|night)$/),
    });
  });

  it("normaliza el texto en la URL y redondea las coordenadas", async () => {
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useClima());

    act(() => {
      void result.current.buscar({ ciudad: "  Nueva   York ", pais: "US" });
    });
    expect(pendientes[0].url).toBe("/api/weather?ciudad=nueva+york&pais=US");

    act(() => {
      void result.current.buscar({ lat: -31.41734, lon: -64.18331, etiqueta: "tu ubicación" });
    });
    expect(pendientes[1].url).toBe("/api/weather?lat=-31.42&lon=-64.18");
  });

  it("el país va en mayúsculas: «ar» y «AR» son la misma URL (misma clave de caché del CDN)", () => {
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useClima());
    act(() => {
      void result.current.buscar({ ciudad: "Córdoba", pais: "ar" });
    });
    act(() => {
      void result.current.buscar({ ciudad: "Córdoba", pais: "AR" });
    });
    expect(pendientes[0].url).toBe(pendientes[1].url);
    expect(pendientes[0].url).toContain("pais=AR");
  });

  it("momento pasa a ser la hora de este dispositivo (la respuesta pudo venir del CDN)", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-14T18:00:00Z"));
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useClima());

    act(() => {
      void result.current.buscar({ ciudad: "Madrid" });
    });
    await act(async () => pendientes[0].resolver(respuestaJson(clima({ momento: 1 }))));
    await waitFor(() => expect(result.current.resultado.estado).toBe("exito"));
    if (result.current.resultado.estado !== "exito") throw new Error("se esperaba éxito");
    expect(result.current.resultado.clima.momento).toBe(Date.UTC(2026, 10, 14, 18) / 1000);
  });

  it("el nombre elegido en español reemplaza al del proveedor", async () => {
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useClima());
    act(() => {
      void result.current.buscar({
        lat: 40.71,
        lon: -74.0,
        etiqueta: "Nueva York",
        nombre: "Nueva York",
        pais: "US",
      });
    });
    await act(async () =>
      pendientes[0].resolver(respuestaJson(clima({ ciudad: "New York", pais: "US" }))),
    );
    await waitFor(() => expect(result.current.resultado.estado).toBe("exito"));
    expect(result.current.resultado).toMatchObject({ clima: { ciudad: "Nueva York" } });
  });

  it("guarda la última consulta; de la ubicación del dispositivo guarda la ciudad, no las coordenadas", async () => {
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useClima());
    act(() => {
      void result.current.buscar({ lat: -31.41, lon: -64.18, etiqueta: "tu ubicación" });
    });
    await act(async () =>
      pendientes[0].resolver(respuestaJson(clima({ ciudad: "Córdoba", pais: "AR" }))),
    );
    await waitFor(() => expect(result.current.resultado.estado).toBe("exito"));
    const guardado = JSON.parse(window.localStorage.getItem("atmosfera:ultima-consulta") ?? "null");
    expect(guardado).toStrictEqual({ ciudad: "Córdoba", pais: "AR" });
  });

  it("si localStorage falla, la búsqueda igual funciona", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cuota llena");
    });
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useClima());
    act(() => {
      void result.current.buscar({ ciudad: "Madrid" });
    });
    await act(async () => pendientes[0].resolver(respuestaJson(clima())));
    await waitFor(() => expect(result.current.resultado.estado).toBe("exito"));
  });
});

describe("useClima · carreras y cancelaciones", () => {
  it("una búsqueda nueva aborta la anterior", () => {
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useClima());
    act(() => {
      void result.current.buscar({ ciudad: "Madrid" });
    });
    act(() => {
      void result.current.buscar({ ciudad: "Tokio" });
    });
    expect(pendientes[0].signal?.aborted).toBe(true);
    expect(pendientes[1].signal?.aborted).toBe(false);
  });

  it("si la respuesta vieja llega DESPUÉS de la nueva, se ignora", async () => {
    const { pendientes } = fetchControlable({ respetarAbort: false });
    const { result } = renderHook(() => useClima());
    act(() => {
      void result.current.buscar({ ciudad: "Madrid" });
    });
    act(() => {
      void result.current.buscar({ ciudad: "Tokio" });
    });

    await act(async () => pendientes[1].resolver(respuestaJson(clima({ ciudad: "Tokio", pais: "JP" }))));
    await waitFor(() => expect(result.current.resultado.estado).toBe("exito"));
    await act(async () => pendientes[0].resolver(respuestaJson(clima({ ciudad: "Madrid" }))));

    expect(result.current.resultado).toMatchObject({ estado: "exito", clima: { ciudad: "Tokio" } });
  });

  it("si la respuesta vieja llega ANTES de la nueva, tampoco pisa el estado de carga", async () => {
    const { pendientes } = fetchControlable({ respetarAbort: false });
    const { result } = renderHook(() => useClima());
    act(() => {
      void result.current.buscar({ ciudad: "Madrid" });
    });
    act(() => {
      void result.current.buscar({ ciudad: "Tokio" });
    });

    await act(async () => pendientes[0].resolver(respuestaJson(clima({ ciudad: "Madrid" }))));
    expect(result.current.resultado).toMatchObject({ estado: "cargando", consulta: "Tokio" });

    await act(async () => pendientes[1].resolver(respuestaJson(clima({ ciudad: "Tokio" }))));
    await waitFor(() => expect(result.current.resultado.estado).toBe("exito"));
    expect(result.current.resultado).toMatchObject({ clima: { ciudad: "Tokio" } });
  });

  it("el AbortError de la búsqueda reemplazada no se muestra como error", async () => {
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useClima());
    act(() => {
      void result.current.buscar({ ciudad: "Madrid" });
    });
    await act(async () => {
      void result.current.buscar({ ciudad: "Tokio" });
    });
    expect(result.current.resultado.estado).toBe("cargando");
    await act(async () => pendientes[1].resolver(respuestaJson(clima({ ciudad: "Tokio" }))));
    await waitFor(() => expect(result.current.resultado.estado).toBe("exito"));
  });

  it("al desmontar se aborta el pedido en curso y no hay actualizaciones de estado", async () => {
    const errores = vi.spyOn(console, "error").mockImplementation(() => {});
    const { pendientes } = fetchControlable({ respetarAbort: false });
    const { result, unmount } = renderHook(() => useClima());
    act(() => {
      void result.current.buscar({ ciudad: "Madrid" });
    });
    unmount();
    expect(pendientes[0].signal?.aborted).toBe(true);
    await act(async () => pendientes[0].resolver(respuestaJson(clima())));
    expect(errores).not.toHaveBeenCalled();
  });
});

describe("useClima · errores", () => {
  async function buscarConRespuesta(respuesta: Response | Error) {
    const { pendientes } = fetchControlable();
    const hook = renderHook(() => useClima());
    act(() => {
      void hook.result.current.buscar({ ciudad: "Xyzabc" });
    });
    await act(async () => {
      if (respuesta instanceof Error) pendientes[0].rechazar(respuesta);
      else pendientes[0].resolver(respuesta);
    });
    await waitFor(() => expect(hook.result.current.resultado.estado).toBe("error"));
    return hook.result.current.resultado;
  }

  it("ciudad inexistente: error de tipo ciudad, con el cielo inicial", async () => {
    const resultado = await buscarConRespuesta(
      respuestaJson(errorApi("CIUDAD_NO_ENCONTRADA", "No se encontró la ciudad indicada."), 404),
    );
    expect(resultado).toMatchObject({
      estado: "error",
      tipo: "ciudad",
      consulta: "Xyzabc",
      cielo: "clear-day",
    });
  });

  it("falla del servicio: error de tipo servicio, con el cielo de lluvia y el mensaje del servidor", async () => {
    const resultado = await buscarConRespuesta(
      respuestaJson(errorApi("SERVICIO_NO_DISPONIBLE", "El servicio no está disponible."), 502),
    );
    expect(resultado).toMatchObject({
      tipo: "servicio",
      cielo: "rain",
      mensaje: "El servicio no está disponible.",
    });
  });

  it("429 del límite por IP: error de servicio con el mensaje de espera", async () => {
    const resultado = await buscarConRespuesta(
      respuestaJson(errorApi("LIMITE_DE_CONSULTAS", "Probá de nuevo en 12 segundos."), 429),
    );
    expect(resultado).toMatchObject({ tipo: "servicio", mensaje: "Probá de nuevo en 12 segundos." });
  });

  it("sin conexión: mensaje de red", async () => {
    const resultado = await buscarConRespuesta(new TypeError("Failed to fetch"));
    expect(resultado).toMatchObject({ tipo: "servicio" });
    expect(resultado.estado === "error" && resultado.mensaje).toContain("conectar");
  });

  it("respuesta con otra forma: error inesperado, sin romper", async () => {
    const resultado = await buscarConRespuesta(respuestaJson({ ciudad: "Madrid" }));
    expect(resultado).toMatchObject({ tipo: "servicio" });
  });

  it("cuerpo que no es JSON: error inesperado", async () => {
    const resultado = await buscarConRespuesta(new Response("<html>", { status: 502 }));
    expect(resultado).toMatchObject({ tipo: "servicio" });
  });
});

describe("useClima · reintentar", () => {
  it("repite la última consulta", async () => {
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useClima());
    act(() => {
      void result.current.buscar({ ciudad: "Madrid", pais: "ES" });
    });
    await act(async () =>
      pendientes[0].resolver(respuestaJson(errorApi("SERVICIO_NO_DISPONIBLE", "x"), 502)),
    );
    await waitFor(() => expect(result.current.resultado.estado).toBe("error"));

    act(() => result.current.reintentar());
    expect(pendientes).toHaveLength(2);
    expect(pendientes[1].url).toBe(pendientes[0].url);
    expect(result.current.resultado.estado).toBe("cargando");
  });

  it("sin una consulta previa no hace nada", () => {
    const { simulacro } = fetchControlable();
    const { result } = renderHook(() => useClima());
    act(() => result.current.reintentar());
    expect(simulacro).not.toHaveBeenCalled();
  });
});

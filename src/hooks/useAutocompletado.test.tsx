// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CampoBusqueda from "@/components/CampoBusqueda";
import { fetchControlable } from "@/test/fetchControlable";
import { respuestaJson } from "@/test/rutas";
import type { Sugerencia } from "@/types/geocoding";
import { useAutocompletado } from "./useAutocompletado";
import { useSugerencias } from "./useSugerencias";

function lugar(nombre: string, pais: string, lat: number): Sugerencia {
  return { nombre, estado: null, pais, lat, lon: lat };
}
const CORDOBA_AR = lugar("Córdoba", "AR", -31);
const CORDOBA_ES = lugar("Córdoba", "ES", 37);
const SANTIAGO = lugar("Santiago", "CL", -33);

function respuesta(...sugerencias: Sugerencia[]) {
  return respuestaJson({ sugerencias });
}

/** Avanza el reloj simulado y deja resolver las promesas pendientes. */
async function avanzar(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useSugerencias · debounce, mínimo y cancelación", () => {
  it("no pide nada con menos de 3 caracteres", async () => {
    const { simulacro } = fetchControlable();
    renderHook(() => useSugerencias({ ciudad: "Có" }));
    await avanzar(1000);
    expect(simulacro).not.toHaveBeenCalled();
  });

  it("no pide nada si no hay búsqueda (null)", async () => {
    const { simulacro } = fetchControlable();
    renderHook(() => useSugerencias(null));
    await avanzar(1000);
    expect(simulacro).not.toHaveBeenCalled();
  });

  it("espera 300 ms sin cambios antes de pedir", async () => {
    const { simulacro } = fetchControlable();
    renderHook(() => useSugerencias({ ciudad: "Córd" }));
    await avanzar(299);
    expect(simulacro).not.toHaveBeenCalled();
    await avanzar(1);
    expect(simulacro).toHaveBeenCalledTimes(1);
  });

  it("si se sigue escribiendo, solo pide el último texto (un pedido, no uno por letra)", async () => {
    const { simulacro, pendientes } = fetchControlable();
    const { rerender } = renderHook(({ ciudad }) => useSugerencias({ ciudad }), {
      initialProps: { ciudad: "Cór" },
    });
    await avanzar(200);
    rerender({ ciudad: "Córd" });
    await avanzar(200);
    rerender({ ciudad: "Córdo" });
    await avanzar(300);

    expect(simulacro).toHaveBeenCalledTimes(1);
    expect(pendientes[0].url).toContain("ciudad=c%C3%B3rdo");
  });

  it("cancela con AbortController la búsqueda anterior cuando cambia el texto", async () => {
    const { pendientes } = fetchControlable();
    const { rerender } = renderHook(({ ciudad }) => useSugerencias({ ciudad }), {
      initialProps: { ciudad: "Cór" },
    });
    await avanzar(300);
    expect(pendientes[0].signal?.aborted).toBe(false);

    rerender({ ciudad: "Córd" });
    expect(pendientes[0].signal?.aborted).toBe(true);
  });

  it("al desmontar cancela el pedido en curso y el temporizador pendiente", async () => {
    const { simulacro, pendientes } = fetchControlable();
    const enCurso = renderHook(() => useSugerencias({ ciudad: "Córd" }));
    await avanzar(300);
    enCurso.unmount();
    expect(pendientes[0].signal?.aborted).toBe(true);

    const pendiente = renderHook(() => useSugerencias({ ciudad: "Santi" }));
    pendiente.unmount();
    await avanzar(1000);
    expect(simulacro).toHaveBeenCalledTimes(1);
  });

  it("normaliza el texto: espacios de más y mayúsculas no cambian el pedido", async () => {
    const { pendientes } = fetchControlable();
    renderHook(() => useSugerencias({ ciudad: "  Nueva   YORK ", pais: "US" }));
    await avanzar(300);
    expect(pendientes[0].url).toBe("/api/geocode?ciudad=nueva+york&pais=US");
  });

  it("el país va en mayúsculas: «ar» y «AR» piden la misma URL (misma clave de caché del CDN)", async () => {
    const { pendientes } = fetchControlable();
    renderHook(() => useSugerencias({ ciudad: "Córdoba", pais: "ar" }));
    renderHook(() => useSugerencias({ ciudad: "Córdoba", pais: "AR" }));
    await avanzar(300);
    expect(pendientes).toHaveLength(2);
    expect(pendientes[0].url).toBe(pendientes[1].url);
    expect(pendientes[0].url).toContain("pais=AR");
  });

  it("una respuesta que llega tarde de un texto anterior no se muestra", async () => {
    const { pendientes } = fetchControlable({ respetarAbort: false });
    const { result, rerender } = renderHook(({ ciudad }) => useSugerencias({ ciudad }), {
      initialProps: { ciudad: "Cór" },
    });
    await avanzar(300);
    rerender({ ciudad: "Córd" });
    await avanzar(300);

    await act(async () => pendientes[0].resolver(respuesta(SANTIAGO)));
    expect(result.current.sugerencias).toStrictEqual([]);

    await act(async () => pendientes[1].resolver(respuesta(CORDOBA_AR, CORDOBA_ES)));
    expect(result.current.sugerencias).toHaveLength(2);
  });

  it("si el pedido falla, no hay sugerencias (la búsqueda por texto sigue andando)", async () => {
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useSugerencias({ ciudad: "Córd" }));
    await avanzar(300);
    await act(async () => pendientes[0].resolver(respuestaJson({ error: {} }, 502)));
    expect(result.current.sugerencias).toStrictEqual([]);
    expect(result.current.cargando).toBe(false);
  });
});

describe("useSugerencias · invalidación de las sugerencias viejas", () => {
  it("al escribir, las sugerencias anteriores dejan de valer en el acto", async () => {
    const { pendientes } = fetchControlable();
    const { result, rerender } = renderHook(({ ciudad }) => useSugerencias({ ciudad }), {
      initialProps: { ciudad: "Sant" },
    });
    await avanzar(300);
    await act(async () => pendientes[0].resolver(respuesta(SANTIAGO)));
    expect(result.current.sugerencias).toStrictEqual([SANTIAGO]);

    rerender({ ciudad: "Santa Fe" });
    expect(result.current.sugerencias).toStrictEqual([]);
    expect(result.current.cargando).toBe(true);
  });

  it("al bajar del mínimo se vacía la lista", async () => {
    const { pendientes } = fetchControlable();
    const { result, rerender } = renderHook(({ ciudad }) => useSugerencias({ ciudad }), {
      initialProps: { ciudad: "Córd" },
    });
    await avanzar(300);
    await act(async () => pendientes[0].resolver(respuesta(CORDOBA_AR)));
    expect(result.current.sugerencias).toHaveLength(1);

    rerender({ ciudad: "Có" });
    expect(result.current.sugerencias).toStrictEqual([]);
  });
});

describe("useAutocompletado · estado del combobox", () => {
  async function conSugerencias(texto: string, ...sugerencias: Sugerencia[]) {
    const { pendientes } = fetchControlable();
    const hook = renderHook(({ t }) => useAutocompletado(t), { initialProps: { t: texto } });
    act(() => hook.result.current.abrir());
    await avanzar(300);
    await act(async () => pendientes[0].resolver(respuesta(...sugerencias)));
    return { ...hook, pendientes };
  }

  it("no se abre hasta que la persona escribe (abrir), aunque el texto sea consultable", async () => {
    const { simulacro } = fetchControlable();
    const { result } = renderHook(() => useAutocompletado("Córdoba"));
    await avanzar(1000);
    expect(simulacro).not.toHaveBeenCalled();
    expect(result.current.abierta).toBe(false);
  });

  it("al abrir y llegar resultados, queda abierta con la primera opción activa", async () => {
    const { result } = await conSugerencias("Córd", CORDOBA_AR, CORDOBA_ES);
    expect(result.current.abierta).toBe(true);
    expect(result.current.indiceActivo).toBe(0);
    expect(result.current.sugerencias).toHaveLength(2);
  });

  it("mover recorre las opciones con vuelta en los extremos", async () => {
    const { result } = await conSugerencias("Córd", CORDOBA_AR, CORDOBA_ES, SANTIAGO);
    act(() => result.current.mover(1));
    expect(result.current.indiceActivo).toBe(1);
    act(() => result.current.mover(1));
    act(() => result.current.mover(1));
    expect(result.current.indiceActivo).toBe(0); // vuelve al principio
    act(() => result.current.mover(-1));
    expect(result.current.indiceActivo).toBe(2); // vuelve al final
  });

  it("cerrar oculta la lista; abrir la reabre y reinicia la opción activa", async () => {
    const { result } = await conSugerencias("Córd", CORDOBA_AR, CORDOBA_ES);
    act(() => result.current.mover(1));
    act(() => result.current.cerrar());
    expect(result.current.abierta).toBe(false);
    act(() => result.current.abrir());
    expect(result.current.indiceActivo).toBe(0);
  });

  it("con una coma sin país reconocible no consulta (no es una ciudad válida)", async () => {
    const { simulacro } = fetchControlable();
    const { result } = renderHook(() => useAutocompletado("Córdoba, Arg"));
    act(() => result.current.abrir());
    await avanzar(1000);
    expect(simulacro).not.toHaveBeenCalled();
  });

  it("«Ciudad, AR» consulta la ciudad acotada al país", async () => {
    const { pendientes } = fetchControlable();
    const { result } = renderHook(() => useAutocompletado("Córdoba, AR"));
    act(() => result.current.abrir());
    await avanzar(300);
    expect(pendientes[0].url).toBe("/api/geocode?ciudad=c%C3%B3rdoba&pais=AR");
    expect(result.current.escrito).toBe("Córdoba");
  });

  it("al seguir escribiendo, la lista se cierra hasta que llegan las nuevas sugerencias", async () => {
    const { result, rerender } = await conSugerencias("Sant", SANTIAGO);
    expect(result.current.abierta).toBe(true);
    rerender({ t: "Santa Fe" });
    expect(result.current.abierta).toBe(false);
  });
});

/** Campo de búsqueda conectado al autocompletado, como en AppClima. */
function Prueba({
  alElegir,
  alBuscar,
  textoInicial = "",
}: {
  alElegir: (s: Sugerencia) => void;
  alBuscar: () => void;
  textoInicial?: string;
}) {
  const [texto, setTexto] = useState(textoInicial);
  const autocompletado = useAutocompletado(texto);
  return (
    <CampoBusqueda
      valor={texto}
      mensajeError={null}
      invalido={false}
      onCambiar={(v) => {
        setTexto(v);
        autocompletado.abrir();
      }}
      onBuscar={alBuscar}
      autocompletado={autocompletado}
      onElegirSugerencia={alElegir}
    />
  );
}

describe("CampoBusqueda · teclado del combobox (↑ ↓ Enter Esc)", () => {
  async function escribirYRecibir(
    texto: string,
    sugerencias: Sugerencia[],
    props: { alElegir?: (s: Sugerencia) => void; alBuscar?: () => void } = {},
  ) {
    const control = fetchControlable();
    const alElegir = props.alElegir ?? vi.fn();
    const alBuscar = props.alBuscar ?? vi.fn();
    render(<Prueba alElegir={alElegir} alBuscar={alBuscar} />);
    const campo = screen.getByRole("combobox");
    fireEvent.change(campo, { target: { value: texto } });
    await avanzar(300);
    await act(async () => control.pendientes[0].resolver(respuesta(...sugerencias)));
    return { campo, alElegir, alBuscar, ...control };
  }

  it("expone los atributos ARIA del patrón combobox con la primera opción activa", async () => {
    const { campo } = await escribirYRecibir("Córd", [CORDOBA_AR, CORDOBA_ES]);
    expect(campo.getAttribute("aria-expanded")).toBe("true");
    expect(campo.getAttribute("aria-autocomplete")).toBe("list");
    const lista = screen.getByRole("listbox");
    expect(campo.getAttribute("aria-controls")).toBe(lista.id);
    const opciones = screen.getAllByRole("option");
    expect(opciones).toHaveLength(2);
    expect(campo.getAttribute("aria-activedescendant")).toBe(opciones[0].id);
    expect(opciones[0].getAttribute("aria-selected")).toBe("true");
    expect(opciones[1].getAttribute("aria-selected")).toBe("false");
  });

  it("↓ y ↑ mueven la opción activa (aria-activedescendant) sin sacar el foco del campo", async () => {
    const { campo } = await escribirYRecibir("Córd", [CORDOBA_AR, CORDOBA_ES]);
    campo.focus();
    fireEvent.keyDown(campo, { key: "ArrowDown" });
    const opciones = screen.getAllByRole("option");
    expect(campo.getAttribute("aria-activedescendant")).toBe(opciones[1].id);
    expect(document.activeElement).toBe(campo);
    fireEvent.keyDown(campo, { key: "ArrowUp" });
    expect(campo.getAttribute("aria-activedescendant")).toBe(opciones[0].id);
  });

  it("Enter con la lista abierta elige la opción activa y no envía el formulario", async () => {
    const { campo, alElegir, alBuscar } = await escribirYRecibir("Córd", [CORDOBA_AR, CORDOBA_ES]);
    fireEvent.keyDown(campo, { key: "ArrowDown" });
    const noPrevenido = fireEvent.keyDown(campo, { key: "Enter" });
    expect(noPrevenido).toBe(false); // preventDefault: el navegador no envía el formulario
    expect(alElegir).toHaveBeenCalledTimes(1);
    expect(alElegir).toHaveBeenCalledWith(CORDOBA_ES);
    expect(alBuscar).not.toHaveBeenCalled();
  });

  it("Esc cierra la lista; después Enter no elige nada y deja que el formulario se envíe", async () => {
    const { campo, alElegir } = await escribirYRecibir("Córd", [CORDOBA_AR]);
    const escPrevenido = fireEvent.keyDown(campo, { key: "Escape" });
    expect(escPrevenido).toBe(false);
    expect(campo.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("listbox")).toBeNull();

    const enterNoPrevenido = fireEvent.keyDown(campo, { key: "Enter" });
    expect(enterNoPrevenido).toBe(true);
    expect(alElegir).not.toHaveBeenCalled();
  });

  it("Enter justo después de seguir escribiendo NUNCA elige la sugerencia vieja", async () => {
    const { campo, alElegir } = await escribirYRecibir("Sant", [SANTIAGO]);
    expect(screen.getByRole("listbox")).not.toBeNull();

    // Se termina de escribir y se aprieta Enter antes de que lleguen las sugerencias nuevas.
    fireEvent.change(campo, { target: { value: "Santa Fe" } });
    expect(screen.queryByRole("listbox")).toBeNull();
    const noPrevenido = fireEvent.keyDown(campo, { key: "Enter" });

    expect(noPrevenido).toBe(true); // el formulario se envía con el texto escrito
    expect(alElegir).not.toHaveBeenCalled();
  });

  it("↓ con la lista cerrada la vuelve a abrir", async () => {
    const control = fetchControlable();
    render(<Prueba alElegir={vi.fn()} alBuscar={vi.fn()} />);
    const campo = screen.getByRole("combobox");
    fireEvent.change(campo, { target: { value: "Córd" } });
    await avanzar(300);
    await act(async () => control.pendientes[0].resolver(respuesta(CORDOBA_AR)));
    fireEvent.keyDown(campo, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();

    fireEvent.keyDown(campo, { key: "ArrowDown" });
    await avanzar(300);
    await act(async () => control.pendientes.at(-1)?.resolver(respuesta(CORDOBA_AR)));
    expect(screen.getByRole("listbox")).not.toBeNull();
  });

  it("anuncia la cantidad de sugerencias en una región status", async () => {
    await escribirYRecibir("Córd", [CORDOBA_AR, CORDOBA_ES]);
    expect(screen.getByText(/2 sugerencias/).textContent).toContain("2 sugerencias");
  });

  it("clic en una opción la elige", async () => {
    const { alElegir } = await escribirYRecibir("Córd", [CORDOBA_AR, CORDOBA_ES]);
    fireEvent.click(screen.getAllByRole("option")[1]);
    expect(alElegir).toHaveBeenCalledWith(CORDOBA_ES);
  });
});

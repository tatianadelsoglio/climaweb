import { beforeEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria } from "@/lib/almacenLimite";
import { LIMITES } from "@/lib/limitarPeticiones";
import {
  errorDeTimeout,
  opcionesLlamada,
  pedidoApi,
  respuestaJson,
  respuestaMalformada,
  simularFetch,
  urlLlamada,
} from "@/test/rutas";
import { GET } from "./route";

function lugar(nombre: string, estado: string, pais: string, lat: number, lon: number) {
  return { id: lat * 1000, name: nombre, latitude: lat, longitude: lon, country_code: pais, admin1: estado };
}

// Forma real de /v1/search?language=es.
const OPEN_METEO = {
  results: [
    lugar("Córdoba", "Provincia de Córdoba", "AR", -31.40648, -64.18853),
    lugar("Córdoba", "Andalucía", "ES", 37.89155, -4.77275),
    lugar("Córdoba", "Estado de Veracruz-Llave", "MX", 18.8842, -96.92559),
  ],
  generationtime_ms: 0.5,
};

beforeEach(() => {
  almacenEnMemoria.reiniciar();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/geocode · validación", () => {
  it("400 sin ciudad", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    const respuesta = await GET(pedidoApi("/api/geocode"));
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).error.codigo).toBe("PARAMETROS_INVALIDOS");
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("400 con menos de 3 caracteres", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    for (const ciudad of ["a", "Có", "  ab  "]) {
      const respuesta = await GET(pedidoApi("/api/geocode", { ciudad }));
      expect(respuesta.status).toBe(400);
      expect((await respuesta.json()).error.mensaje).toContain("3 caracteres");
    }
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("400 con caracteres no permitidos o país inválido", async () => {
    simularFetch(respuestaJson(OPEN_METEO));
    expect((await GET(pedidoApi("/api/geocode", { ciudad: "Córd&count=1000" }))).status).toBe(400);
    expect((await GET(pedidoApi("/api/geocode", { ciudad: "Córdoba", pais: "ARG" }))).status).toBe(400);
  });

  it("no necesita la API key de OpenWeather", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "");
    simularFetch(respuestaJson(OPEN_METEO));
    const respuesta = await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }));
    expect(respuesta.status).toBe(200);
  });
});

describe("GET /api/geocode · respuesta normalizada", () => {
  it("200 con sugerencias normalizadas (nombre, estado, país, lat y lon)", async () => {
    simularFetch(respuestaJson(OPEN_METEO));
    const respuesta = await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }));
    expect(respuesta.status).toBe(200);
    const { sugerencias } = await respuesta.json();
    expect(sugerencias).toHaveLength(3);
    expect(sugerencias[0]).toStrictEqual({
      nombre: "Córdoba",
      estado: "Provincia de Córdoba",
      pais: "AR",
      lat: -31.40648,
      lon: -64.18853,
    });
  });

  it("limita a 5 resultados y elimina repetidos", async () => {
    const muchos = Array.from({ length: 10 }, (_, i) => lugar("Santa Fe", `Estado ${i}`, "AR", i, i));
    simularFetch(respuestaJson({ results: [...muchos, muchos[0]] }));
    const { sugerencias } = await (await GET(pedidoApi("/api/geocode", { ciudad: "Santa" }))).json();
    expect(sugerencias).toHaveLength(5);
  });

  it("sin coincidencias (Open-Meteo omite results) → lista vacía, no error", async () => {
    simularFetch(respuestaJson({ generationtime_ms: 0.2 }));
    const respuesta = await GET(pedidoApi("/api/geocode", { ciudad: "Xyzabc" }));
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toStrictEqual({ sugerencias: [] });
  });

  it("pide español, 10 resultados y acota al país si se indicó", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    await GET(pedidoApi("/api/geocode", { ciudad: "Córdoba", pais: "es" }));
    const url = urlLlamada(fetchSimulado);
    expect(url.origin + url.pathname).toBe("https://geocoding-api.open-meteo.com/v1/search");
    expect(url.searchParams.get("language")).toBe("es");
    expect(url.searchParams.get("count")).toBe("10");
    expect(url.searchParams.get("countryCode")).toBe("ES");
  });

  it("acepta el apóstrofe tipográfico de iOS", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    const respuesta = await GET(pedidoApi("/api/geocode", { ciudad: "L’Aquila" }));
    expect(respuesta.status).toBe(200);
    expect(urlLlamada(fetchSimulado).searchParams.get("name")).toBe("l'aquila");
  });
});

describe("GET /api/geocode · caché", () => {
  it("pide al proveedor cachear 24 horas", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }));
    expect(opcionesLlamada(fetchSimulado).next?.revalidate).toBe(86_400);
  });

  it("textos equivalentes arman la misma URL (misma clave de caché)", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    await GET(pedidoApi("/api/geocode", { ciudad: "  Nueva   York " }));
    await GET(pedidoApi("/api/geocode", { ciudad: "nueva york" }));
    expect(urlLlamada(fetchSimulado, 0).href).toBe(urlLlamada(fetchSimulado, 1).href);
    expect(urlLlamada(fetchSimulado, 0).searchParams.get("name")).toBe("nueva york");
  });

  it("Cache-Control para el CDN: s-maxage 24 h y stale-while-revalidate", async () => {
    simularFetch(respuestaJson(OPEN_METEO));
    const respuesta = await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }));
    expect(respuesta.headers.get("Cache-Control")).toBe(
      "public, s-maxage=86400, stale-while-revalidate=43200",
    );
  });

  it("los errores no se cachean", async () => {
    simularFetch(respuestaJson({ error: true }, 500));
    const respuesta = await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }));
    expect(respuesta.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("GET /api/geocode · errores del proveedor", () => {
  it("500 del proveedor → 502 SERVICIO_NO_DISPONIBLE", async () => {
    simularFetch(respuestaJson({ error: true }, 500));
    const respuesta = await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }));
    expect(respuesta.status).toBe(502);
    expect((await respuesta.json()).error.codigo).toBe("SERVICIO_NO_DISPONIBLE");
  });

  it("429 del proveedor → LIMITE_DE_CONSULTAS", async () => {
    simularFetch(respuestaJson({ error: true }, 429));
    const respuesta = await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }));
    expect(respuesta.status).toBe(429);
    expect((await respuesta.json()).error.codigo).toBe("LIMITE_DE_CONSULTAS");
  });

  it("timeout → 504", async () => {
    simularFetch(errorDeTimeout());
    expect((await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }))).status).toBe(504);
  });

  it("cuerpo que no es JSON → 502 RESPUESTA_INVALIDA", async () => {
    simularFetch(respuestaMalformada());
    const respuesta = await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }));
    expect(respuesta.status).toBe(502);
    expect((await respuesta.json()).error.codigo).toBe("RESPUESTA_INVALIDA");
  });

  it("JSON con otra forma → lista vacía (no se inventan sugerencias)", async () => {
    simularFetch(respuestaJson({ results: [{ name: "X" }, null, 7] }));
    const respuesta = await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }));
    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).sugerencias).toStrictEqual([]);
  });
});

describe("GET /api/geocode · límite por IP", () => {
  it("responde 429 con Retry-After al pasar la ráfaga y sin llamar al proveedor", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    for (let i = 0; i < LIMITES.geocode.capacidad; i++) {
      expect((await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }))).status).toBe(200);
    }
    const llamadasAntes = fetchSimulado.mock.calls.length;
    const bloqueada = await GET(pedidoApi("/api/geocode", { ciudad: "Córd" }));
    expect(bloqueada.status).toBe(429);
    expect(Number(bloqueada.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
    expect(fetchSimulado.mock.calls.length).toBe(llamadasAntes);
  });
});

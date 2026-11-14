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

// Forma real de la respuesta de /v1/forecast con daily y timezone=auto.
const OPEN_METEO = {
  latitude: -31.4587,
  longitude: -64.19354,
  timezone: "America/Argentina/Cordoba",
  utc_offset_seconds: -10800,
  daily: {
    time: ["2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"],
    temperature_2m_max: [26.7, 27.8, 28.0, 27.2, 25.8, 22.1, 24.5],
    temperature_2m_min: [19.0, 15.1, 18.7, 16.6, 16.4, 14.9, 12.5],
    precipitation_probability_max: [57, 3, 85, 82, 69, 81, 69],
    weather_code: [96, 3, 96, 53, 53, 95, 3],
  },
};

const COORDENADAS = { lat: "-31.4173", lon: "-64.1833" };

beforeEach(() => {
  almacenEnMemoria.reiniciar();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/forecast · validación", () => {
  it("400 sin coordenadas, incompletas, no numéricas o fuera de rango", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    const casos: Array<Record<string, string>> = [{}, { lat: "10" }, { lon: "10" }, { lat: "x", lon: "10" }, { lat: "95", lon: "0" }, { lat: "0", lon: "-200" }];
    for (const parametros of casos) {
      const respuesta = await GET(pedidoApi("/api/forecast", parametros));
      expect(respuesta.status).toBe(400);
      expect((await respuesta.json()).error.codigo).toBe("PARAMETROS_INVALIDOS");
    }
    expect(fetchSimulado).not.toHaveBeenCalled();
  });
});

describe("GET /api/forecast · respuesta normalizada", () => {
  it("200 con 7 días, hoy primero, y las condiciones traducidas", async () => {
    simularFetch(respuestaJson(OPEN_METEO));
    const respuesta = await GET(pedidoApi("/api/forecast", COORDENADAS));
    expect(respuesta.status).toBe(200);
    const { dias } = await respuesta.json();
    expect(dias).toHaveLength(7);
    expect(dias[0]).toStrictEqual({
      fecha: "2026-11-14",
      minima: 19.0,
      maxima: 26.7,
      codigo: 212, // WMO 96 → tormenta con granizo
      probabilidadLluvia: 57,
    });
    expect(dias[1].codigo).toBe(804); // WMO 3 → nublado
  });

  it("pide al proveedor el daily correcto con el huso de la ubicación", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    await GET(pedidoApi("/api/forecast", COORDENADAS));
    const url = urlLlamada(fetchSimulado);
    expect(url.origin + url.pathname).toBe("https://api.open-meteo.com/v1/forecast");
    expect(url.searchParams.get("latitude")).toBe("-31.42");
    expect(url.searchParams.get("longitude")).toBe("-64.18");
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(url.searchParams.get("forecast_days")).toBe("7");
    expect(url.searchParams.get("daily")).toBe(
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    );
  });

  it("los valores null del proveedor no rompen: el día inválido se descarta", async () => {
    const conNulos = {
      daily: { ...OPEN_METEO.daily, temperature_2m_max: [null, ...OPEN_METEO.daily.temperature_2m_max.slice(1)] },
    };
    simularFetch(respuestaJson(conNulos));
    const { dias } = await (await GET(pedidoApi("/api/forecast", COORDENADAS))).json();
    expect(dias).toHaveLength(6);
    expect(dias[0].fecha).toBe("2026-11-15");
  });

  it("sin probabilidad de lluvia el día se conserva con null", async () => {
    const sinLluvia = { daily: { ...OPEN_METEO.daily, precipitation_probability_max: undefined } };
    simularFetch(respuestaJson(sinLluvia));
    const { dias } = await (await GET(pedidoApi("/api/forecast", COORDENADAS))).json();
    expect(dias).toHaveLength(7);
    expect(dias[0].probabilidadLluvia).toBeNull();
  });
});

describe("GET /api/forecast · caché", () => {
  it("pide al proveedor cachear 30 minutos", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    await GET(pedidoApi("/api/forecast", COORDENADAS));
    expect(opcionesLlamada(fetchSimulado).next?.revalidate).toBe(1800);
  });

  it("ubicaciones a menos de ~1 km arman la misma URL (misma clave de caché)", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    await GET(pedidoApi("/api/forecast", { lat: "-31.4173", lon: "-64.1833" }));
    await GET(pedidoApi("/api/forecast", { lat: "-31.4201", lon: "-64.1849" }));
    expect(urlLlamada(fetchSimulado, 0).href).toBe(urlLlamada(fetchSimulado, 1).href);
  });

  it("Cache-Control para el CDN: s-maxage 30 min y stale-while-revalidate", async () => {
    simularFetch(respuestaJson(OPEN_METEO));
    const respuesta = await GET(pedidoApi("/api/forecast", COORDENADAS));
    expect(respuesta.headers.get("Cache-Control")).toBe(
      "public, s-maxage=1800, stale-while-revalidate=900",
    );
  });

  it("los errores no se cachean", async () => {
    simularFetch(respuestaJson({ error: true }, 500));
    const respuesta = await GET(pedidoApi("/api/forecast", COORDENADAS));
    expect(respuesta.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("GET /api/forecast · errores del proveedor", () => {
  it("400 del proveedor → 502 SERVICIO_NO_DISPONIBLE", async () => {
    simularFetch(respuestaJson({ error: true, reason: "Latitude must be in range" }, 400));
    const respuesta = await GET(pedidoApi("/api/forecast", COORDENADAS));
    expect(respuesta.status).toBe(502);
    const texto = JSON.stringify(await respuesta.json());
    expect(texto).toContain("SERVICIO_NO_DISPONIBLE");
    expect(texto).not.toContain("Latitude must be");
  });

  it("429 del proveedor → LIMITE_DE_CONSULTAS", async () => {
    simularFetch(respuestaJson({ error: true }, 429));
    const respuesta = await GET(pedidoApi("/api/forecast", COORDENADAS));
    expect(respuesta.status).toBe(429);
    expect((await respuesta.json()).error.codigo).toBe("LIMITE_DE_CONSULTAS");
  });

  it("timeout → 504", async () => {
    simularFetch(errorDeTimeout());
    const respuesta = await GET(pedidoApi("/api/forecast", COORDENADAS));
    expect(respuesta.status).toBe(504);
  });

  it("cuerpo que no es JSON → 502 RESPUESTA_INVALIDA", async () => {
    simularFetch(respuestaMalformada());
    const respuesta = await GET(pedidoApi("/api/forecast", COORDENADAS));
    expect(respuesta.status).toBe(502);
    expect((await respuesta.json()).error.codigo).toBe("RESPUESTA_INVALIDA");
  });

  it("JSON sin daily o sin ningún día válido → 502 RESPUESTA_INVALIDA", async () => {
    simularFetch(respuestaJson({ latitude: 1 }));
    expect((await GET(pedidoApi("/api/forecast", COORDENADAS))).status).toBe(502);

    simularFetch(
      respuestaJson({ daily: { ...OPEN_METEO.daily, weather_code: [999, 999, 999, 999, 999, 999, 999] } }),
    );
    const respuesta = await GET(pedidoApi("/api/forecast", COORDENADAS));
    expect(respuesta.status).toBe(502);
    expect((await respuesta.json()).error.codigo).toBe("RESPUESTA_INVALIDA");
  });
});

describe("GET /api/forecast · límite por IP", () => {
  it("responde 429 con Retry-After al pasar la ráfaga y sin llamar al proveedor", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPEN_METEO));
    for (let i = 0; i < LIMITES.forecast.capacidad; i++) {
      expect((await GET(pedidoApi("/api/forecast", COORDENADAS))).status).toBe(200);
    }
    const llamadasAntes = fetchSimulado.mock.calls.length;
    const bloqueada = await GET(pedidoApi("/api/forecast", COORDENADAS));
    expect(bloqueada.status).toBe(429);
    expect(Number(bloqueada.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
    expect(fetchSimulado.mock.calls.length).toBe(llamadasAntes);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const CLAVE_DE_PRUEBA = "clave-de-prueba-123";

// Forma real de la respuesta de /data/2.5/weather.
const OPENWEATHER = {
  coord: { lon: -3.7026, lat: 40.4165 },
  weather: [{ id: 803, main: "Clouds", description: "muy nuboso", icon: "04n" }],
  main: { temp: 12.23, feels_like: 11.91, temp_min: 10, temp_max: 14, humidity: 92 },
  wind: { speed: 4.63, deg: 240 },
  sys: { country: "ES", sunrise: 1_794_639_576, sunset: 1_794_675_542 },
  timezone: 3600,
  name: "Madrid",
};

beforeEach(() => {
  vi.stubEnv("OPENWEATHER_API_KEY", CLAVE_DE_PRUEBA);
  almacenEnMemoria.reiniciar();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/weather · validación", () => {
  it("400 sin ciudad ni coordenadas", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPENWEATHER));
    const respuesta = await GET(pedidoApi("/api/weather"));
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).error.codigo).toBe("PARAMETROS_INVALIDOS");
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("400 con caracteres no permitidos en la ciudad", async () => {
    simularFetch(respuestaJson(OPENWEATHER));
    for (const ciudad of ["<script>", "Madrid&appid=x", "Madrid;DROP", "123"]) {
      expect((await GET(pedidoApi("/api/weather", { ciudad }))).status).toBe(400);
    }
  });

  it("400 con un país que no es un código de 2 letras", async () => {
    simularFetch(respuestaJson(OPENWEATHER));
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Madrid", pais: "ESP" }));
    expect(respuesta.status).toBe(400);
  });

  it("400 con coordenadas incompletas, no numéricas o fuera de rango", async () => {
    simularFetch(respuestaJson(OPENWEATHER));
    const casos: Array<Record<string, string>> = [
      { lat: "40" },
      { lat: "abc", lon: "10" },
      { lat: "1e-8", lon: "10" },
      { lat: "91", lon: "0" },
      { lat: "0", lon: "181" },
    ];
    for (const parametros of casos) {
      expect((await GET(pedidoApi("/api/weather", parametros))).status).toBe(400);
    }
  });

  it("500 SERVICIO_NO_CONFIGURADO sin API key, sin llamar al proveedor", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "");
    const fetchSimulado = simularFetch(respuestaJson(OPENWEATHER));
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(respuesta.status).toBe(500);
    expect((await respuesta.json()).error.codigo).toBe("SERVICIO_NO_CONFIGURADO");
    expect(fetchSimulado).not.toHaveBeenCalled();
  });
});

describe("GET /api/weather · respuesta normalizada", () => {
  it("200 con el clima normalizado (km/h, coordenadas, sin la descripción del proveedor)", async () => {
    simularFetch(respuestaJson(OPENWEATHER));
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(respuesta.status).toBe(200);
    const clima = await respuesta.json();
    expect(clima).toMatchObject({
      ciudad: "Madrid",
      pais: "ES",
      temperatura: 12.23,
      sensacionTermica: 11.91,
      humedad: 92,
      condicion: { codigo: 803 },
      zonaHoraria: 3600,
      amanecer: 1_794_639_576,
      atardecer: 1_794_675_542,
      coordenadas: { lat: 40.4165, lon: -3.7026 },
    });
    expect(clima.viento.velocidad).toBeCloseTo(16.668, 3); // 4,63 m/s → km/h
    expect(clima.viento.direccion).toBe(240);
    expect(JSON.stringify(clima)).not.toContain("muy nuboso");
    expect(typeof clima.momento).toBe("number");
  });

  it("amanecer y atardecer iguales o faltantes salen como null (sol de medianoche)", async () => {
    simularFetch(respuestaJson({ ...OPENWEATHER, sys: { country: "NO", sunrise: 5, sunset: 5 } }));
    const iguales = await (await GET(pedidoApi("/api/weather", { ciudad: "Tromso" }))).json();
    expect(iguales.amanecer).toBeNull();
    expect(iguales.atardecer).toBeNull();

    simularFetch(respuestaJson({ ...OPENWEATHER, sys: { country: "NO" } }));
    const faltantes = await (await GET(pedidoApi("/api/weather", { ciudad: "Tromso" }))).json();
    expect(faltantes.amanecer).toBeNull();
  });

  it("sin dirección del viento, direccion es null", async () => {
    simularFetch(respuestaJson({ ...OPENWEATHER, wind: { speed: 1 } }));
    const clima = await (await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }))).json();
    expect(clima.viento.direccion).toBeNull();
  });

  it("consulta por coordenadas redondeadas a 2 decimales", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPENWEATHER));
    await GET(pedidoApi("/api/weather", { lat: "-31.41734", lon: "-64.18331" }));
    const url = urlLlamada(fetchSimulado);
    expect(url.searchParams.get("lat")).toBe("-31.42");
    expect(url.searchParams.get("lon")).toBe("-64.18");
    expect(url.searchParams.has("q")).toBe(false);
  });
});

describe("GET /api/weather · caché", () => {
  it("hace un solo pedido al proveedor por consulta", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPENWEATHER));
    await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(fetchSimulado).toHaveBeenCalledTimes(1);
  });

  it("pide al proveedor cachear 10 minutos", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPENWEATHER));
    await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(opcionesLlamada(fetchSimulado).next?.revalidate).toBe(600);
  });

  it("consultas equivalentes arman la misma URL (misma clave de caché)", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPENWEATHER));
    await GET(pedidoApi("/api/weather", { ciudad: "  Nueva   York ", pais: "us" }));
    await GET(pedidoApi("/api/weather", { ciudad: "nueva york", pais: "US" }));
    expect(urlLlamada(fetchSimulado, 0).href).toBe(urlLlamada(fetchSimulado, 1).href);
    expect(urlLlamada(fetchSimulado, 0).searchParams.get("q")).toBe("nueva york,US");
  });

  it("coordenadas a menos de ~1 km comparten URL", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPENWEATHER));
    await GET(pedidoApi("/api/weather", { lat: "-31.4173", lon: "-64.1833" }));
    await GET(pedidoApi("/api/weather", { lat: "-31.4201", lon: "-64.1849" }));
    expect(urlLlamada(fetchSimulado, 0).href).toBe(urlLlamada(fetchSimulado, 1).href);
  });

  it("Cache-Control para el CDN: s-maxage 10 min y stale-while-revalidate", async () => {
    simularFetch(respuestaJson(OPENWEATHER));
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(respuesta.headers.get("Cache-Control")).toBe(
      "public, s-maxage=600, stale-while-revalidate=300",
    );
  });

  it("los errores no se cachean", async () => {
    simularFetch(respuestaJson({ cod: "404" }, 404));
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Xyzabc" }));
    expect(respuesta.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("GET /api/weather · errores del proveedor", () => {
  it("404 → CIUDAD_NO_ENCONTRADA", async () => {
    simularFetch(respuestaJson({ cod: "404", message: "city not found" }, 404));
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Xyzabc" }));
    expect(respuesta.status).toBe(404);
    expect((await respuesta.json()).error.codigo).toBe("CIUDAD_NO_ENCONTRADA");
  });

  it("401 (nuestra key rechazada) → 502 sin exponer la key ni el detalle", async () => {
    simularFetch(respuestaJson({ cod: 401, message: "Invalid API key" }, 401));
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(respuesta.status).toBe(502);
    const texto = JSON.stringify(await respuesta.json());
    expect(texto).toContain("SERVICIO_NO_CONFIGURADO");
    expect(texto).not.toContain(CLAVE_DE_PRUEBA);
    expect(texto).not.toContain("Invalid API key");
  });

  it("429 del proveedor → LIMITE_DE_CONSULTAS", async () => {
    simularFetch(respuestaJson({ cod: 429 }, 429));
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(respuesta.status).toBe(429);
    expect((await respuesta.json()).error.codigo).toBe("LIMITE_DE_CONSULTAS");
  });

  it("500 del proveedor → 502 SERVICIO_NO_DISPONIBLE", async () => {
    simularFetch(respuestaJson({ cod: 500 }, 500));
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(respuesta.status).toBe(502);
    expect((await respuesta.json()).error.codigo).toBe("SERVICIO_NO_DISPONIBLE");
  });

  it("timeout → 504 SERVICIO_NO_DISPONIBLE", async () => {
    simularFetch(errorDeTimeout());
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(respuesta.status).toBe(504);
    expect((await respuesta.json()).error.codigo).toBe("SERVICIO_NO_DISPONIBLE");
  });

  it("error de red → 502, sin filtrar la URL con la key", async () => {
    simularFetch(new TypeError(`fetch failed https://api.openweathermap.org?appid=${CLAVE_DE_PRUEBA}`));
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(respuesta.status).toBe(502);
    expect(JSON.stringify(await respuesta.json())).not.toContain(CLAVE_DE_PRUEBA);
  });

  it("cuerpo que no es JSON → 502 RESPUESTA_INVALIDA", async () => {
    simularFetch(respuestaMalformada());
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(respuesta.status).toBe(502);
    expect((await respuesta.json()).error.codigo).toBe("RESPUESTA_INVALIDA");
  });

  it("JSON con otra forma (faltan campos) → 502 RESPUESTA_INVALIDA", async () => {
    simularFetch(respuestaJson({ name: "Madrid" }));
    const respuesta = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(respuesta.status).toBe(502);
    expect((await respuesta.json()).error.codigo).toBe("RESPUESTA_INVALIDA");
  });
});

describe("GET /api/weather · límite por IP", () => {
  it("responde 429 con Retry-After al pasar la ráfaga y sin llamar al proveedor", async () => {
    const fetchSimulado = simularFetch(respuestaJson(OPENWEATHER));
    for (let i = 0; i < LIMITES.weather.capacidad; i++) {
      expect((await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }))).status).toBe(200);
    }
    const llamadasAntes = fetchSimulado.mock.calls.length;

    const bloqueada = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }));
    expect(bloqueada.status).toBe(429);
    expect(Number(bloqueada.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
    expect((await bloqueada.json()).error.codigo).toBe("LIMITE_DE_CONSULTAS");
    expect(fetchSimulado.mock.calls.length).toBe(llamadasAntes);
  });

  it("otra IP no se ve afectada", async () => {
    simularFetch(respuestaJson(OPENWEATHER));
    for (let i = 0; i < LIMITES.weather.capacidad + 1; i++) {
      await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }, "198.51.100.1"));
    }
    const otra = await GET(pedidoApi("/api/weather", { ciudad: "Madrid" }, "198.51.100.2"));
    expect(otra.status).toBe(200);
  });
});

import { describe, expect, it } from "vitest";
import { esRespuestaPronostico, normalizarPronostico } from "./openMeteo";

// Forma real de la respuesta de /v1/forecast?daily=...&timezone=auto&forecast_days=7.
const RESPUESTA = {
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

describe("normalizarPronostico", () => {
  it("devuelve 7 días, con hoy primero", () => {
    const dias = normalizarPronostico(RESPUESTA);
    expect(dias.length).toBe(7);
    expect(dias[0].fecha).toBe("2026-11-14");
    expect(dias[6].fecha).toBe("2026-11-20");
  });

  it("toma la mínima y la máxima del día completo", () => {
    const [hoy] = normalizarPronostico(RESPUESTA);
    expect(hoy.minima).toBe(19.0);
    expect(hoy.maxima).toBe(26.7);
  });

  it("traduce el weather_code a condición de OpenWeather", () => {
    const dias = normalizarPronostico(RESPUESTA);
    expect(dias[0].codigo).toBe(212); // WMO 96: tormenta con granizo
    expect(dias[1].codigo).toBe(804); // WMO 3: cubierto
    expect(dias[3].codigo).toBe(301); // WMO 53: llovizna
  });

  it("la probabilidad de lluvia sale de precipitation_probability_max", () => {
    const dias = normalizarPronostico(RESPUESTA);
    expect(dias.map((d) => d.probabilidadLluvia)).toStrictEqual([57, 3, 85, 82, 69, 81, 69]);
  });

  it("sin probabilidad (columna ausente o null) queda en null, sin descartar el día", () => {
    const sinColumna = {
      daily: { ...RESPUESTA.daily, precipitation_probability_max: undefined },
    };
    expect(normalizarPronostico(sinColumna).map((d) => d.probabilidadLluvia)).toStrictEqual(
      Array(7).fill(null),
    );

    const conNull = {
      daily: { ...RESPUESTA.daily, precipitation_probability_max: [null, 10, 20, 30, 40, 50, 60] },
    };
    const dias = normalizarPronostico(conNull);
    expect(dias.length).toBe(7);
    expect(dias[0].probabilidadLluvia).toBe(null);
    expect(dias[1].probabilidadLluvia).toBe(10);
  });

  it("descarta los días con temperatura, fecha o código inválidos", () => {
    const dias = normalizarPronostico({
      daily: {
        time: ["2026-11-14", "ayer", "2026-11-16", "2026-11-17", "2026-11-18"],
        temperature_2m_max: [20, 21, null, 23, 24],
        temperature_2m_min: [10, 11, 12, 13, 14],
        precipitation_probability_max: [0, 0, 0, 0, 0],
        weather_code: [0, 0, 0, 999, 61],
      },
    });
    expect(dias.map((d) => d.fecha)).toStrictEqual(["2026-11-14", "2026-11-18"]);
  });

  it("no pasa de 7 días", () => {
    const fechas = Array.from({ length: 10 }, (_, i) => `2026-11-${String(10 + i).padStart(2, "0")}`);
    const diez = Array.from({ length: 10 }, () => 10);
    const dias = normalizarPronostico({
      daily: {
        time: fechas,
        temperature_2m_max: diez,
        temperature_2m_min: diez,
        weather_code: diez.map(() => 0),
      },
    });
    expect(dias.length).toBe(7);
  });

  it("acota la probabilidad al rango 0 a 100", () => {
    const dias = normalizarPronostico({
      daily: { ...RESPUESTA.daily, precipitation_probability_max: [150, -5, 0.4, 10, 10, 10, 10] },
    });
    expect(dias.slice(0, 3).map((d) => d.probabilidadLluvia)).toStrictEqual([100, 0, 0]);
  });

  it("una respuesta sin daily o con columnas faltantes da un arreglo vacío", () => {
    expect(normalizarPronostico(null)).toStrictEqual([]);
    expect(normalizarPronostico({})).toStrictEqual([]);
    expect(normalizarPronostico({ daily: { time: ["2026-11-14"] } })).toStrictEqual([]);
    expect(normalizarPronostico({ error: true, reason: "x" })).toStrictEqual([]);
  });
});

describe("esRespuestaPronostico", () => {
  const dia = { fecha: "2026-11-14", minima: 10, maxima: 20, codigo: 800, probabilidadLluvia: 10 };

  it("acepta lo que genera normalizarPronostico", () => {
    expect(esRespuestaPronostico({ dias: normalizarPronostico(RESPUESTA) })).toBe(true);
    expect(esRespuestaPronostico({ dias: [{ ...dia, probabilidadLluvia: null }] })).toBe(true);
  });

  it("rechaza formas inválidas", () => {
    expect(esRespuestaPronostico(null)).toBe(false);
    expect(esRespuestaPronostico({ dias: [] })).toBe(false);
    expect(esRespuestaPronostico({ dias: [{ ...dia, fecha: "hoy" }] })).toBe(false);
    expect(esRespuestaPronostico({ dias: [{ ...dia, maxima: "20" }] })).toBe(false);
    expect(esRespuestaPronostico({ dias: [{ ...dia, probabilidadLluvia: undefined }] })).toBe(false);
  });
});

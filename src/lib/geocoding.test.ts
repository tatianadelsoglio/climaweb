import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LIMITE_SUGERENCIAS,
  normalizarGeocoding,
  sugerenciasVigentes,
} from "./geocoding.ts";

// Forma real de un resultado de /v1/search?language=es.
const cordoba = {
  id: 3860259,
  name: "Córdoba",
  latitude: -31.40648,
  longitude: -64.18853,
  country_code: "AR",
  admin1: "Provincia de Córdoba",
  country: "Argentina",
  population: 2106734,
};

function respuesta(...results: unknown[]) {
  return { results, generationtime_ms: 0.4 };
}

describe("normalizarGeocoding", () => {
  it("normaliza nombre, estado, país y coordenadas", () => {
    assert.deepEqual(normalizarGeocoding(respuesta(cordoba)), [
      {
        nombre: "Córdoba",
        estado: "Provincia de Córdoba",
        pais: "AR",
        lat: -31.40648,
        lon: -64.18853,
      },
    ]);
  });

  it("el estado es opcional", () => {
    const sinEstado = { ...cordoba, admin1: undefined };
    assert.equal(normalizarGeocoding(respuesta(sinEstado))[0].estado, null);
    assert.equal(normalizarGeocoding(respuesta({ ...cordoba, admin1: "  " }))[0].estado, null);
  });

  it("resuelve «Nueva York»: nombre en español y estado", () => {
    const [s] = normalizarGeocoding(
      respuesta({
        name: "Nueva York",
        latitude: 40.71427,
        longitude: -74.00597,
        country_code: "US",
        admin1: "Nueva York",
      }),
    );
    assert.equal(s.nombre, "Nueva York");
    assert.equal(s.estado, "Nueva York");
    assert.equal(s.pais, "US");
  });

  it("pasa el país a mayúsculas", () => {
    assert.equal(normalizarGeocoding(respuesta({ ...cordoba, country_code: "ar" }))[0].pais, "AR");
  });

  it("descarta los elementos inválidos", () => {
    const resultado = normalizarGeocoding(
      respuesta(
        null,
        "x",
        { ...cordoba, latitude: "1" },
        { ...cordoba, longitude: 400 },
        { ...cordoba, name: "" },
        { ...cordoba, country_code: "ARG" },
        { ...cordoba, country_code: undefined },
        cordoba,
      ),
    );
    assert.equal(resultado.length, 1);
  });

  it("elimina los repetidos", () => {
    const resultado = normalizarGeocoding(
      respuesta(
        cordoba,
        { ...cordoba, latitude: -31.5 },
        { ...cordoba, admin1: "Andalucía", country_code: "ES", latitude: 37.9, longitude: -4.8 },
      ),
    );
    assert.equal(resultado.length, 2);
  });

  it("elimina el mismo lugar con otro nombre (mismas coordenadas)", () => {
    const resultado = normalizarGeocoding(
      respuesta(
        { ...cordoba, name: "Buenos Aires" },
        { ...cordoba, name: "Ciudad Autónoma de Buenos Aires" },
      ),
    );
    assert.deepEqual(
      resultado.map((s) => s.nombre),
      ["Buenos Aires"],
    );
  });

  it("limita a 5 resultados", () => {
    const muchos = Array.from({ length: 10 }, (_, i) => ({
      ...cordoba,
      admin1: `Estado ${i}`,
      latitude: i,
      longitude: i,
    }));
    assert.equal(normalizarGeocoding(respuesta(...muchos)).length, LIMITE_SUGERENCIAS);
  });

  it("sin resultados (Open-Meteo omite `results`) o con otra forma, lista vacía", () => {
    assert.deepEqual(normalizarGeocoding({ generationtime_ms: 0.2 }), []);
    assert.deepEqual(normalizarGeocoding(null), []);
    assert.deepEqual(normalizarGeocoding({ results: "x" }), []);
    assert.deepEqual(normalizarGeocoding([cordoba]), []);
  });
});

describe("sugerenciasVigentes", () => {
  const santiago = { nombre: "Santiago", estado: null, pais: "CL", lat: -33.4, lon: -70.6 };
  const vigente = { clave: "Sant|", sugerencias: [santiago] };

  it("devuelve las sugerencias de la búsqueda actual", () => {
    assert.deepEqual(sugerenciasVigentes(vigente, "Sant|"), [santiago]);
  });

  it("al escribir más, las de la clave anterior ya no valen (Enter no las elige)", () => {
    assert.deepEqual(sugerenciasVigentes(vigente, "Santa Fe|"), []);
  });

  it("sin clave (texto corto) o sin respuesta no hay sugerencias", () => {
    assert.deepEqual(sugerenciasVigentes(vigente, null), []);
    assert.deepEqual(sugerenciasVigentes(null, "Sant|"), []);
  });
});

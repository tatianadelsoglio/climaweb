import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LIMITE_SUGERENCIAS, normalizarGeocoding } from "./geocoding.ts";

const cordoba = {
  name: "Cordoba",
  local_names: { es: "Córdoba", en: "Cordoba" },
  lat: -31.4135,
  lon: -64.18105,
  country: "AR",
  state: "Córdoba",
};

describe("normalizarGeocoding", () => {
  it("usa el nombre en español si existe", () => {
    assert.deepEqual(normalizarGeocoding([cordoba]), [
      { nombre: "Córdoba", estado: "Córdoba", pais: "AR", lat: -31.4135, lon: -64.18105 },
    ]);
  });

  it("sin local_names.es usa el nombre original", () => {
    const [s] = normalizarGeocoding([{ ...cordoba, local_names: { en: "Cordoba" } }]);
    assert.equal(s.nombre, "Cordoba");
    const [t] = normalizarGeocoding([{ ...cordoba, local_names: undefined }]);
    assert.equal(t.nombre, "Cordoba");
  });

  it("ignora un local_names.es vacío", () => {
    const [s] = normalizarGeocoding([{ ...cordoba, local_names: { es: "  " } }]);
    assert.equal(s.nombre, "Cordoba");
  });

  it("el estado es opcional", () => {
    const sinEstado = { ...cordoba, state: undefined };
    assert.equal(normalizarGeocoding([sinEstado])[0].estado, null);
  });

  it("resuelve «Nueva York»: nombre en español y estado", () => {
    const [s] = normalizarGeocoding([
      {
        name: "City of New York",
        local_names: { es: "Nueva York" },
        lat: 40.7127,
        lon: -74.0059,
        country: "US",
        state: "New York",
      },
    ]);
    assert.equal(s.nombre, "Nueva York");
    assert.equal(s.estado, "New York");
    assert.equal(s.pais, "US");
  });

  it("pasa el país a mayúsculas", () => {
    assert.equal(normalizarGeocoding([{ ...cordoba, country: "ar" }])[0].pais, "AR");
  });

  it("descarta los elementos inválidos", () => {
    const resultado = normalizarGeocoding([
      null,
      "x",
      { ...cordoba, lat: "1" },
      { ...cordoba, lon: 400 },
      { ...cordoba, name: "" },
      { ...cordoba, country: "ARG" },
      cordoba,
    ]);
    assert.equal(resultado.length, 1);
  });

  it("elimina los repetidos", () => {
    const resultado = normalizarGeocoding([
      cordoba,
      { ...cordoba, lat: -31.5 },
      { ...cordoba, state: "Andalucía", country: "ES" },
    ]);
    assert.equal(resultado.length, 2);
  });

  it("limita a 5 resultados", () => {
    const muchos = Array.from({ length: 8 }, (_, i) => ({ ...cordoba, state: `Estado ${i}` }));
    assert.equal(normalizarGeocoding(muchos).length, LIMITE_SUGERENCIAS);
  });

  it("una respuesta que no es lista da un arreglo vacío", () => {
    assert.deepEqual(normalizarGeocoding(null), []);
    assert.deepEqual(normalizarGeocoding({ cod: 401 }), []);
  });
});

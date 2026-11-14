import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { convertirTemperatura, esUnidad } from "./unidades.ts";

describe("convertirTemperatura", () => {
  it("Celsius queda igual", () => {
    assert.equal(convertirTemperatura(24.4, "C"), 24.4);
  });

  it("puntos de referencia en Fahrenheit", () => {
    assert.equal(convertirTemperatura(0, "F"), 32);
    assert.equal(convertirTemperatura(100, "F"), 212);
    assert.equal(convertirTemperatura(-40, "F"), -40);
    assert.ok(Math.abs(convertirTemperatura(37, "F") - 98.6) < 1e-9);
  });

  it("no pierde precisión al ir y venir con valores comunes", () => {
    const f = convertirTemperatura(21.5, "F");
    assert.ok(Math.abs(((f - 32) * 5) / 9 - 21.5) < 1e-9);
  });
});

describe("esUnidad", () => {
  it("solo acepta C y F", () => {
    assert.equal(esUnidad("C"), true);
    assert.equal(esUnidad("F"), true);
    assert.equal(esUnidad("K"), false);
    assert.equal(esUnidad(null), false);
  });
});

import { describe, expect, it } from "vitest";
import { convertirTemperatura, esUnidad } from "./unidades";

describe("convertirTemperatura", () => {
  it("Celsius queda igual", () => {
    expect(convertirTemperatura(24.4, "C")).toBe(24.4);
  });

  it("puntos de referencia en Fahrenheit", () => {
    expect(convertirTemperatura(0, "F")).toBe(32);
    expect(convertirTemperatura(100, "F")).toBe(212);
    expect(convertirTemperatura(-40, "F")).toBe(-40);
    expect(Math.abs(convertirTemperatura(37, "F") - 98.6) < 1e-9).toBeTruthy();
  });

  it("no pierde precisión al ir y venir con valores comunes", () => {
    const f = convertirTemperatura(21.5, "F");
    expect(Math.abs(((f - 32) * 5) / 9 - 21.5) < 1e-9).toBeTruthy();
  });
});

describe("esUnidad", () => {
  it("solo acepta C y F", () => {
    expect(esUnidad("C")).toBe(true);
    expect(esUnidad("F")).toBe(true);
    expect(esUnidad("K")).toBe(false);
    expect(esUnidad(null)).toBe(false);
  });
});

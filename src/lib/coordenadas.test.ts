import { describe, expect, it } from "vitest";
import { formatearCoordenada } from "./coordenadas";

describe("formatearCoordenada", () => {
  it("usa 4 decimales", () => {
    expect(formatearCoordenada(-31.4173391)).toBe("-31.4173");
    expect(formatearCoordenada(40.7)).toBe("40.7000");
  });

  it("nunca usa notación científica", () => {
    expect(formatearCoordenada(0.00000001)).toBe("0.0000");
    expect(formatearCoordenada(1e-8)).toBe("0.0000");
    expect(!/e/i.test(formatearCoordenada(123456789e-12))).toBeTruthy();
  });

  it("no devuelve «-0.0000»", () => {
    expect(formatearCoordenada(-0.00001)).toBe("0.0000");
    expect(formatearCoordenada(-0)).toBe("0.0000");
  });

  it("conserva los límites", () => {
    expect(formatearCoordenada(90)).toBe("90.0000");
    expect(formatearCoordenada(-180)).toBe("-180.0000");
  });
});

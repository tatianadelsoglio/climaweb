import { describe, expect, it } from "vitest";
import { formatearCoordenada } from "./coordenadas";

describe("formatearCoordenada", () => {
  it("usa 2 decimales (redondea, no corta)", () => {
    expect(formatearCoordenada(-31.4173391)).toBe("-31.42");
    expect(formatearCoordenada(40.7)).toBe("40.70");
    expect(formatearCoordenada(40.7149)).toBe("40.71");
  });

  it("nunca usa notación científica", () => {
    expect(formatearCoordenada(0.00000001)).toBe("0.00");
    expect(formatearCoordenada(1e-8)).toBe("0.00");
    expect(formatearCoordenada(123456789e-12)).not.toMatch(/e/i);
  });

  it("no devuelve «-0.00»", () => {
    expect(formatearCoordenada(-0.001)).toBe("0.00");
    expect(formatearCoordenada(-0)).toBe("0.00");
  });

  it("conserva los límites", () => {
    expect(formatearCoordenada(90)).toBe("90.00");
    expect(formatearCoordenada(-180)).toBe("-180.00");
  });

  it("ubicaciones a menos de ~1 km comparten texto (misma clave de caché)", () => {
    expect(formatearCoordenada(-31.4173)).toBe(formatearCoordenada(-31.4201));
  });
});

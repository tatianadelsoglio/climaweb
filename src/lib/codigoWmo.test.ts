import { describe, expect, it } from "vitest";
import { descripcionCondicion } from "./condiciones";
import { condicionDeWmo } from "./codigoWmo";

const CODIGOS_WMO = [
  0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
  95, 96, 99,
];

describe("condicionDeWmo", () => {
  it("cielo despejado y nubes", () => {
    expect(condicionDeWmo(0)).toBe(800);
    expect(condicionDeWmo(1)).toBe(801);
    expect(condicionDeWmo(2)).toBe(802);
    expect(condicionDeWmo(3)).toBe(804);
  });

  it("agrupa como OpenWeather: niebla 7xx, llovizna 3xx, lluvia 5xx, nieve 6xx, tormenta 2xx", () => {
    expect(Math.floor((condicionDeWmo(45) ?? 0) / 100)).toBe(7);
    expect(Math.floor((condicionDeWmo(53) ?? 0) / 100)).toBe(3);
    expect(Math.floor((condicionDeWmo(63) ?? 0) / 100)).toBe(5);
    expect(Math.floor((condicionDeWmo(81) ?? 0) / 100)).toBe(5);
    expect(Math.floor((condicionDeWmo(73) ?? 0) / 100)).toBe(6);
    expect(Math.floor((condicionDeWmo(86) ?? 0) / 100)).toBe(6);
    expect(Math.floor((condicionDeWmo(95) ?? 0) / 100)).toBe(2);
    expect(Math.floor((condicionDeWmo(99) ?? 0) / 100)).toBe(2);
  });

  it("lluvia y llovizna heladas son lluvia helada", () => {
    expect(condicionDeWmo(56)).toBe(511);
    expect(condicionDeWmo(66)).toBe(511);
  });

  it("todos los códigos WMO que informa Open-Meteo tienen condición y descripción propia", () => {
    for (const wmo of CODIGOS_WMO) {
      const condicion = condicionDeWmo(wmo);
      expect(condicion, `WMO ${wmo}`).not.toBe(null);
      expect(descripcionCondicion(condicion as number), `WMO ${wmo}`).not.toBe("Condición no disponible");
    }
  });

  it("un código desconocido da null", () => {
    expect(condicionDeWmo(4)).toBe(null);
    expect(condicionDeWmo(-1)).toBe(null);
    expect(condicionDeWmo(100)).toBe(null);
  });
});

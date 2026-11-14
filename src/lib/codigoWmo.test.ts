import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { descripcionCondicion } from "./condiciones.ts";
import { condicionDeWmo } from "./codigoWmo.ts";

const CODIGOS_WMO = [
  0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
  95, 96, 99,
];

describe("condicionDeWmo", () => {
  it("cielo despejado y nubes", () => {
    assert.equal(condicionDeWmo(0), 800);
    assert.equal(condicionDeWmo(1), 801);
    assert.equal(condicionDeWmo(2), 802);
    assert.equal(condicionDeWmo(3), 804);
  });

  it("agrupa como OpenWeather: niebla 7xx, llovizna 3xx, lluvia 5xx, nieve 6xx, tormenta 2xx", () => {
    assert.equal(Math.floor((condicionDeWmo(45) ?? 0) / 100), 7);
    assert.equal(Math.floor((condicionDeWmo(53) ?? 0) / 100), 3);
    assert.equal(Math.floor((condicionDeWmo(63) ?? 0) / 100), 5);
    assert.equal(Math.floor((condicionDeWmo(81) ?? 0) / 100), 5);
    assert.equal(Math.floor((condicionDeWmo(73) ?? 0) / 100), 6);
    assert.equal(Math.floor((condicionDeWmo(86) ?? 0) / 100), 6);
    assert.equal(Math.floor((condicionDeWmo(95) ?? 0) / 100), 2);
    assert.equal(Math.floor((condicionDeWmo(99) ?? 0) / 100), 2);
  });

  it("lluvia y llovizna heladas son lluvia helada", () => {
    assert.equal(condicionDeWmo(56), 511);
    assert.equal(condicionDeWmo(66), 511);
  });

  it("todos los códigos WMO que informa Open-Meteo tienen condición y descripción propia", () => {
    for (const wmo of CODIGOS_WMO) {
      const condicion = condicionDeWmo(wmo);
      assert.notEqual(condicion, null, `WMO ${wmo}`);
      assert.notEqual(descripcionCondicion(condicion as number), "Condición no disponible", `WMO ${wmo}`);
    }
  });

  it("un código desconocido da null", () => {
    assert.equal(condicionDeWmo(4), null);
    assert.equal(condicionDeWmo(-1), null);
    assert.equal(condicionDeWmo(100), null);
  });
});

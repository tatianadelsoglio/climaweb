import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { descripcionCondicion } from "./condiciones.ts";

describe("descripcionCondicion", () => {
  it("grupo 80x: despejado y nubosidad", () => {
    assert.equal(descripcionCondicion(800), "Despejado");
    assert.equal(descripcionCondicion(801), "Pocas nubes");
    assert.equal(descripcionCondicion(802), "Parcialmente nublado");
    assert.equal(descripcionCondicion(803), "Mayormente nublado");
    assert.equal(descripcionCondicion(804), "Nublado");
  });

  it("cubre un código de cada grupo", () => {
    assert.equal(descripcionCondicion(211), "Tormenta");
    assert.equal(descripcionCondicion(301), "Llovizna");
    assert.equal(descripcionCondicion(501), "Lluvia moderada");
    assert.equal(descripcionCondicion(601), "Nevada");
    assert.equal(descripcionCondicion(741), "Niebla");
  });

  it("un código desconocido usa la descripción de su grupo", () => {
    assert.equal(descripcionCondicion(299), "Tormenta");
    assert.equal(descripcionCondicion(399), "Llovizna");
    assert.equal(descripcionCondicion(599), "Lluvia");
    assert.equal(descripcionCondicion(699), "Nieve");
    assert.equal(descripcionCondicion(799), "Visibilidad reducida");
    assert.equal(descripcionCondicion(899), "Cielo variable");
  });

  it("un código fuera de todos los grupos tiene respaldo", () => {
    assert.equal(descripcionCondicion(0), "Condición no disponible");
    assert.equal(descripcionCondicion(1234), "Condición no disponible");
  });

  it("ninguna descripción conocida está vacía ni en minúscula inicial", () => {
    for (let codigo = 200; codigo <= 804; codigo++) {
      const texto = descripcionCondicion(codigo);
      assert.match(texto, /^\p{Lu}/u, `${codigo}: ${texto}`);
    }
  });
});

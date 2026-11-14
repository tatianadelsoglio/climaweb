import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  interpretarBusqueda,
  MENSAJE_BUSQUEDA_INVALIDA,
  MENSAJE_BUSQUEDA_VACIA,
  parsearBusqueda,
} from "./parsearBusqueda.ts";

describe("parsearBusqueda", () => {
  it("toma el texto sin coma como ciudad", () => {
    assert.deepEqual(parsearBusqueda("  Córdoba "), { ciudad: "Córdoba" });
  });

  it("reconoce el código de país", () => {
    assert.deepEqual(parsearBusqueda("Córdoba, ar"), { ciudad: "Córdoba", pais: "AR" });
  });

  it("reconoce el nombre del país en español, con o sin tildes", () => {
    assert.deepEqual(parsearBusqueda("Córdoba, Argentina"), { ciudad: "Córdoba", pais: "AR" });
    assert.deepEqual(parsearBusqueda("Córdoba, Espana"), { ciudad: "Córdoba", pais: "ES" });
    assert.deepEqual(parsearBusqueda("Puebla, México"), { ciudad: "Puebla", pais: "MX" });
  });

  it("deja el texto entero si el último tramo no es un país", () => {
    assert.deepEqual(parsearBusqueda("Córdoba, Córdoba"), { ciudad: "Córdoba, Córdoba" });
    assert.deepEqual(parsearBusqueda(", AR"), { ciudad: ", AR" });
  });
});

describe("interpretarBusqueda", () => {
  it("devuelve la búsqueda normalizada", () => {
    assert.deepEqual(interpretarBusqueda("Córdoba, Argentina"), {
      valida: true,
      datos: { ciudad: "Córdoba", pais: "AR" },
    });
  });

  it("rechaza el texto vacío o inválido con un mensaje para el usuario", () => {
    assert.deepEqual(interpretarBusqueda("   "), { valida: false, mensaje: MENSAJE_BUSQUEDA_VACIA });
    assert.deepEqual(interpretarBusqueda("123"), { valida: false, mensaje: MENSAJE_BUSQUEDA_INVALIDA });
    assert.deepEqual(interpretarBusqueda("Córdoba, Córdoba"), {
      valida: false,
      mensaje: MENSAJE_BUSQUEDA_INVALIDA,
    });
  });
});

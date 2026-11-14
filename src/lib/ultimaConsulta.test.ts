import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  consultaParaGuardar,
  leerConsultaGuardada,
  textoDeConsulta,
} from "./ultimaConsulta.ts";

const NUEVA_YORK = {
  lat: 40.7127,
  lon: -74.0059,
  etiqueta: "Nueva York",
  nombre: "Nueva York",
  pais: "US",
};

describe("consultaParaGuardar", () => {
  it("guarda tal cual una búsqueda por ciudad", () => {
    assert.deepEqual(consultaParaGuardar({ ciudad: "Madrid", pais: "ES" }, { ciudad: "Madrid", pais: "ES" }), {
      ciudad: "Madrid",
      pais: "ES",
    });
  });

  it("guarda tal cual una sugerencia elegida (con su nombre)", () => {
    assert.deepEqual(consultaParaGuardar(NUEVA_YORK, { ciudad: "New York", pais: "US" }), NUEVA_YORK);
  });

  it("de la ubicación del dispositivo guarda la ciudad, no las coordenadas", () => {
    const guardada = consultaParaGuardar(
      { lat: -31.4173, lon: -64.1833, etiqueta: "tu ubicación" },
      { ciudad: "Córdoba", pais: "AR" },
    );
    assert.deepEqual(guardada, { ciudad: "Córdoba", pais: "AR" });
  });

  it("de la ubicación del dispositivo sin ciudad válida no guarda nada", () => {
    assert.equal(
      consultaParaGuardar({ lat: 0, lon: 0, etiqueta: "tu ubicación" }, { ciudad: "", pais: "" }),
      null,
    );
  });
});

describe("leerConsultaGuardada", () => {
  it("restaura una búsqueda por ciudad", () => {
    assert.deepEqual(leerConsultaGuardada(JSON.stringify({ ciudad: "Madrid", pais: "ES" })), {
      ciudad: "Madrid",
      pais: "ES",
    });
    assert.deepEqual(leerConsultaGuardada(JSON.stringify({ ciudad: "Madrid" })), { ciudad: "Madrid" });
  });

  it("restaura el nombre con que se mostró una búsqueda por ciudad", () => {
    const guardada = { ciudad: "Tokio", pais: "JP", nombre: "Tokio" };
    assert.deepEqual(leerConsultaGuardada(JSON.stringify(guardada)), guardada);
    assert.deepEqual(leerConsultaGuardada(JSON.stringify({ ciudad: "Tokio", nombre: 5 })), {
      ciudad: "Tokio",
    });
  });

  it("restaura una consulta por coordenadas", () => {
    assert.deepEqual(leerConsultaGuardada(JSON.stringify(NUEVA_YORK)), NUEVA_YORK);
  });

  it("sin nada guardado o con basura devuelve null", () => {
    assert.equal(leerConsultaGuardada(null), null);
    assert.equal(leerConsultaGuardada("no es json"), null);
    assert.equal(leerConsultaGuardada("42"), null);
    assert.equal(leerConsultaGuardada("null"), null);
    assert.equal(leerConsultaGuardada("{}"), null);
  });

  it("descarta valores manipulados", () => {
    assert.equal(leerConsultaGuardada(JSON.stringify({ ciudad: "<script>" })), null);
    assert.equal(leerConsultaGuardada(JSON.stringify({ ciudad: "Madrid", pais: "ESP" })), null);
    assert.equal(leerConsultaGuardada(JSON.stringify({ ...NUEVA_YORK, lat: 500 })), null);
    assert.equal(leerConsultaGuardada(JSON.stringify({ ...NUEVA_YORK, nombre: 7 })), null);
    assert.equal(leerConsultaGuardada(JSON.stringify({ lat: 1, lon: 1 })), null);
  });
});

describe("textoDeConsulta", () => {
  it("arma el texto del buscador", () => {
    assert.equal(textoDeConsulta({ ciudad: "Madrid" }), "Madrid");
    assert.equal(textoDeConsulta({ ciudad: "Madrid", pais: "ES" }), "Madrid, ES");
    assert.equal(textoDeConsulta(NUEVA_YORK), "Nueva York, Estados Unidos");
  });
});

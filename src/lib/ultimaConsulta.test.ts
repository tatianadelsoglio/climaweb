import { describe, expect, it } from "vitest";
import {
  consultaParaGuardar,
  leerConsultaGuardada,
  textoDeConsulta,
} from "./ultimaConsulta";

const NUEVA_YORK = {
  lat: 40.7127,
  lon: -74.0059,
  etiqueta: "Nueva York",
  nombre: "Nueva York",
  pais: "US",
};

describe("consultaParaGuardar", () => {
  it("guarda tal cual una búsqueda por ciudad", () => {
    expect(consultaParaGuardar({ ciudad: "Madrid", pais: "ES" }, { ciudad: "Madrid", pais: "ES" })).toStrictEqual({
      ciudad: "Madrid",
      pais: "ES",
    });
  });

  it("guarda tal cual una sugerencia elegida (con su nombre)", () => {
    expect(consultaParaGuardar(NUEVA_YORK, { ciudad: "New York", pais: "US" })).toStrictEqual(NUEVA_YORK);
  });

  it("de la ubicación del dispositivo guarda la ciudad, no las coordenadas", () => {
    const guardada = consultaParaGuardar(
      { lat: -31.4173, lon: -64.1833, etiqueta: "tu ubicación" },
      { ciudad: "Córdoba", pais: "AR" },
    );
    expect(guardada).toStrictEqual({ ciudad: "Córdoba", pais: "AR" });
  });

  it("de la ubicación del dispositivo sin ciudad válida no guarda nada", () => {
    expect(consultaParaGuardar({ lat: 0, lon: 0, etiqueta: "tu ubicación" }, { ciudad: "", pais: "" })).toBe(null);
  });
});

describe("leerConsultaGuardada", () => {
  it("restaura una búsqueda por ciudad", () => {
    expect(leerConsultaGuardada(JSON.stringify({ ciudad: "Madrid", pais: "ES" }))).toStrictEqual({
      ciudad: "Madrid",
      pais: "ES",
    });
    expect(leerConsultaGuardada(JSON.stringify({ ciudad: "Madrid" }))).toStrictEqual({ ciudad: "Madrid" });
  });

  it("restaura el nombre con que se mostró una búsqueda por ciudad", () => {
    const guardada = { ciudad: "Tokio", pais: "JP", nombre: "Tokio" };
    expect(leerConsultaGuardada(JSON.stringify(guardada))).toStrictEqual(guardada);
    expect(leerConsultaGuardada(JSON.stringify({ ciudad: "Tokio", nombre: 5 }))).toStrictEqual({
      ciudad: "Tokio",
    });
  });

  it("restaura una consulta por coordenadas", () => {
    expect(leerConsultaGuardada(JSON.stringify(NUEVA_YORK))).toStrictEqual(NUEVA_YORK);
  });

  it("sin nada guardado o con basura devuelve null", () => {
    expect(leerConsultaGuardada(null)).toBe(null);
    expect(leerConsultaGuardada("no es json")).toBe(null);
    expect(leerConsultaGuardada("42")).toBe(null);
    expect(leerConsultaGuardada("null")).toBe(null);
    expect(leerConsultaGuardada("{}")).toBe(null);
  });

  it("descarta valores manipulados", () => {
    expect(leerConsultaGuardada(JSON.stringify({ ciudad: "<script>" }))).toBe(null);
    expect(leerConsultaGuardada(JSON.stringify({ ciudad: "Madrid", pais: "ESP" }))).toBe(null);
    expect(leerConsultaGuardada(JSON.stringify({ ...NUEVA_YORK, lat: 500 }))).toBe(null);
    expect(leerConsultaGuardada(JSON.stringify({ ...NUEVA_YORK, nombre: 7 }))).toBe(null);
    expect(leerConsultaGuardada(JSON.stringify({ lat: 1, lon: 1 }))).toBe(null);
  });
});

describe("textoDeConsulta", () => {
  it("arma el texto del buscador", () => {
    expect(textoDeConsulta({ ciudad: "Madrid" })).toBe("Madrid");
    expect(textoDeConsulta({ ciudad: "Madrid", pais: "ES" })).toBe("Madrid, España");
    expect(textoDeConsulta({ ciudad: "Tokio", pais: "JP", nombre: "Tokio" })).toBe("Tokio, Japón");
    expect(textoDeConsulta(NUEVA_YORK)).toBe("Nueva York, Estados Unidos");
  });
});

import { describe, expect, it } from "vitest";
import {
  interpretarBusqueda,
  MENSAJE_BUSQUEDA_INVALIDA,
  MENSAJE_BUSQUEDA_VACIA,
  parsearBusqueda,
} from "./parsearBusqueda";

describe("parsearBusqueda", () => {
  it("toma el texto sin coma como ciudad", () => {
    expect(parsearBusqueda("  Córdoba ")).toStrictEqual({ ciudad: "Córdoba" });
  });

  it("reconoce el código de país", () => {
    expect(parsearBusqueda("Córdoba, ar")).toStrictEqual({ ciudad: "Córdoba", pais: "AR" });
  });

  it("reconoce el nombre del país en español, con o sin tildes", () => {
    expect(parsearBusqueda("Córdoba, Argentina")).toStrictEqual({ ciudad: "Córdoba", pais: "AR" });
    expect(parsearBusqueda("Córdoba, Espana")).toStrictEqual({ ciudad: "Córdoba", pais: "ES" });
    expect(parsearBusqueda("Puebla, México")).toStrictEqual({ ciudad: "Puebla", pais: "MX" });
  });

  it("deja el texto entero si el último tramo no es un país", () => {
    expect(parsearBusqueda("Córdoba, Córdoba")).toStrictEqual({ ciudad: "Córdoba, Córdoba" });
    expect(parsearBusqueda(", AR")).toStrictEqual({ ciudad: ", AR" });
  });
});

describe("interpretarBusqueda", () => {
  it("devuelve la búsqueda normalizada", () => {
    expect(interpretarBusqueda("Córdoba, Argentina")).toStrictEqual({
      valida: true,
      datos: { ciudad: "Córdoba", pais: "AR" },
    });
  });

  it("rechaza el texto vacío o inválido con un mensaje para el usuario", () => {
    expect(interpretarBusqueda("   ")).toStrictEqual({ valida: false, mensaje: MENSAJE_BUSQUEDA_VACIA });
    expect(interpretarBusqueda("123")).toStrictEqual({ valida: false, mensaje: MENSAJE_BUSQUEDA_INVALIDA });
    expect(interpretarBusqueda("Córdoba, Córdoba")).toStrictEqual({
      valida: false,
      mensaje: MENSAJE_BUSQUEDA_INVALIDA,
    });
  });
});

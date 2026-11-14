import { describe, expect, it } from "vitest";
import {
  dividirCoincidencia,
  etiquetasCortas,
  regionSugerencia,
  textoSugerencia,
} from "./sugerencias";
import type { Sugerencia } from "../types/geocoding";

const cordobaAr: Sugerencia = { nombre: "Córdoba", estado: "Córdoba", pais: "AR", lat: 0, lon: 0 };
const cordobaEs: Sugerencia = { nombre: "Córdoba", estado: "Andalucía", pais: "ES", lat: 0, lon: 0 };
const cordobaAr2: Sugerencia = { nombre: "Córdoba", estado: "Santa Fe", pais: "AR", lat: 0, lon: 0 };

describe("dividirCoincidencia", () => {
  it("marca el prefijo escrito", () => {
    expect(dividirCoincidencia("Córdoba", "Córd")).toStrictEqual({ coincide: "Córd", resto: "oba" });
  });

  it("ignora tildes y mayúsculas al comparar, y conserva las del nombre", () => {
    expect(dividirCoincidencia("Córdoba", "cord")).toStrictEqual({ coincide: "Córd", resto: "oba" });
    expect(dividirCoincidencia("Cordova", "Córd")).toStrictEqual({ coincide: "Cord", resto: "ova" });
  });

  it("sin coincidencia de prefijo no marca nada", () => {
    expect(dividirCoincidencia("San Luis", "luis")).toStrictEqual({ coincide: "", resto: "San Luis" });
  });

  it("lo escrito más largo que el nombre no marca nada", () => {
    expect(dividirCoincidencia("Roma", "Romania")).toStrictEqual({ coincide: "", resto: "Roma" });
  });

  it("texto vacío o con espacios", () => {
    expect(dividirCoincidencia("Roma", "  ")).toStrictEqual({ coincide: "", resto: "Roma" });
    expect(dividirCoincidencia("Roma", " ro ")).toStrictEqual({ coincide: "Ro", resto: "ma" });
  });

  it("nombre completo escrito", () => {
    expect(dividirCoincidencia("Roma", "Roma")).toStrictEqual({ coincide: "Roma", resto: "" });
  });
});

describe("textos de las sugerencias", () => {
  it("región: estado y país en español", () => {
    expect(regionSugerencia(cordobaAr)).toBe("Córdoba, Argentina");
    expect(regionSugerencia({ ...cordobaAr, estado: null })).toBe("Argentina");
  });

  it("texto del buscador al elegir", () => {
    expect(textoSugerencia(cordobaAr)).toBe("Córdoba, Córdoba, Argentina");
  });

  it("etiquetas cortas: nombre y país; con estado solo si se repiten", () => {
    expect(etiquetasCortas([cordobaAr, cordobaEs])).toStrictEqual([
      "Córdoba, Argentina",
      "Córdoba, España",
    ]);
    expect(etiquetasCortas([cordobaAr, cordobaAr2])).toStrictEqual([
      "Córdoba, Córdoba, Argentina",
      "Córdoba, Santa Fe, Argentina",
    ]);
  });
});

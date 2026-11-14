import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dividirCoincidencia,
  etiquetasCortas,
  regionSugerencia,
  textoSugerencia,
} from "./sugerencias.ts";
import type { Sugerencia } from "../types/geocoding.ts";

const cordobaAr: Sugerencia = { nombre: "Córdoba", estado: "Córdoba", pais: "AR", lat: 0, lon: 0 };
const cordobaEs: Sugerencia = { nombre: "Córdoba", estado: "Andalucía", pais: "ES", lat: 0, lon: 0 };
const cordobaAr2: Sugerencia = { nombre: "Córdoba", estado: "Santa Fe", pais: "AR", lat: 0, lon: 0 };

describe("dividirCoincidencia", () => {
  it("marca el prefijo escrito", () => {
    assert.deepEqual(dividirCoincidencia("Córdoba", "Córd"), { coincide: "Córd", resto: "oba" });
  });

  it("ignora tildes y mayúsculas al comparar, y conserva las del nombre", () => {
    assert.deepEqual(dividirCoincidencia("Córdoba", "cord"), { coincide: "Córd", resto: "oba" });
    assert.deepEqual(dividirCoincidencia("Cordova", "Córd"), { coincide: "Cord", resto: "ova" });
  });

  it("sin coincidencia de prefijo no marca nada", () => {
    assert.deepEqual(dividirCoincidencia("San Luis", "luis"), { coincide: "", resto: "San Luis" });
  });

  it("lo escrito más largo que el nombre no marca nada", () => {
    assert.deepEqual(dividirCoincidencia("Roma", "Romania"), { coincide: "", resto: "Roma" });
  });

  it("texto vacío o con espacios", () => {
    assert.deepEqual(dividirCoincidencia("Roma", "  "), { coincide: "", resto: "Roma" });
    assert.deepEqual(dividirCoincidencia("Roma", " ro "), { coincide: "Ro", resto: "ma" });
  });

  it("nombre completo escrito", () => {
    assert.deepEqual(dividirCoincidencia("Roma", "Roma"), { coincide: "Roma", resto: "" });
  });
});

describe("textos de las sugerencias", () => {
  it("región: estado y país en español", () => {
    assert.equal(regionSugerencia(cordobaAr), "Córdoba, Argentina");
    assert.equal(regionSugerencia({ ...cordobaAr, estado: null }), "Argentina");
  });

  it("texto del buscador al elegir", () => {
    assert.equal(textoSugerencia(cordobaAr), "Córdoba, Córdoba, Argentina");
  });

  it("etiquetas cortas: nombre y país; con estado solo si se repiten", () => {
    assert.deepEqual(etiquetasCortas([cordobaAr, cordobaEs]), [
      "Córdoba, Argentina",
      "Córdoba, España",
    ]);
    assert.deepEqual(etiquetasCortas([cordobaAr, cordobaAr2]), [
      "Córdoba, Córdoba, Argentina",
      "Córdoba, Santa Fe, Argentina",
    ]);
  });
});

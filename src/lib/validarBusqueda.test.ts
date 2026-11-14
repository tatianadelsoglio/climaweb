import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validarBusqueda, validarCoordenadas } from "./validarBusqueda.ts";

describe("validarBusqueda", () => {
  it("acepta la ciudad sola: el país es opcional", () => {
    assert.deepEqual(validarBusqueda("Córdoba", null), {
      valida: true,
      datos: { ciudad: "Córdoba" },
    });
    assert.deepEqual(validarBusqueda("Córdoba", "   "), {
      valida: true,
      datos: { ciudad: "Córdoba" },
    });
  });

  it("normaliza espacios y pasa el país a mayúsculas", () => {
    assert.deepEqual(validarBusqueda("  San José ", " cr "), {
      valida: true,
      datos: { ciudad: "San José", pais: "CR" },
    });
  });

  it("acepta letras con tildes, espacios, apóstrofes, puntos y guiones", () => {
    for (const ciudad of ["São Paulo", "L'Aquila", "St. John's", "Castilla-La Mancha", "Zürich"]) {
      assert.equal(validarBusqueda(ciudad, null).valida, true, ciudad);
    }
  });

  it("rechaza la ciudad vacía o ausente", () => {
    for (const ciudad of [null, "", "   "]) {
      const resultado = validarBusqueda(ciudad, "AR");
      assert.equal(resultado.valida, false);
      assert.equal(!resultado.valida && resultado.mensaje, "El parámetro ciudad es obligatorio.");
    }
  });

  it("rechaza ciudades con caracteres no permitidos o que no empiezan con letra", () => {
    for (const ciudad of ["123", "Córdoba, AR", "Rosario<script>", "-Rosario", "'Rosario", "Ro;sario"]) {
      const resultado = validarBusqueda(ciudad, null);
      assert.equal(resultado.valida, false, ciudad);
      assert.equal(!resultado.valida && resultado.mensaje, "El parámetro ciudad no es válido.");
    }
  });

  it("acepta hasta 100 caracteres y rechaza más", () => {
    assert.equal(validarBusqueda("a".repeat(100), null).valida, true);
    assert.equal(validarBusqueda("a".repeat(101), null).valida, false);
  });

  it("rechaza un país que no sea un código de 2 letras", () => {
    for (const pais of ["ARG", "A", "A1", "Argentina", "1"]) {
      const resultado = validarBusqueda("Córdoba", pais);
      assert.equal(resultado.valida, false, pais);
      assert.equal(
        !resultado.valida && resultado.mensaje,
        "El parámetro pais debe ser un código de 2 letras (ej: AR).",
      );
    }
  });
});

describe("validarCoordenadas", () => {
  it("acepta coordenadas válidas", () => {
    assert.deepEqual(validarCoordenadas("-31.42", "-64.18"), {
      valida: true,
      datos: { lat: -31.42, lon: -64.18 },
    });
  });

  it("acepta los límites y el cero", () => {
    assert.equal(validarCoordenadas("90", "180").valida, true);
    assert.equal(validarCoordenadas("-90", "-180").valida, true);
    assert.equal(validarCoordenadas("0", "0").valida, true);
  });

  it("rechaza valores faltantes, vacíos o no numéricos", () => {
    assert.equal(validarCoordenadas(null, "10").valida, false);
    assert.equal(validarCoordenadas("10", "").valida, false);
    assert.equal(validarCoordenadas("abc", "10").valida, false);
    assert.equal(validarCoordenadas("1e3", "10").valida, false);
    assert.equal(validarCoordenadas("Infinity", "10").valida, false);
  });

  it("rechaza coordenadas fuera de rango", () => {
    assert.equal(validarCoordenadas("90.1", "0").valida, false);
    assert.equal(validarCoordenadas("0", "-180.5").valida, false);
  });
});

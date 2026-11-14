import { describe, expect, it } from "vitest";
import { validarBusqueda, validarCoordenadas } from "./validarBusqueda";

describe("validarBusqueda", () => {
  it("acepta la ciudad sola: el país es opcional", () => {
    expect(validarBusqueda("Córdoba", null)).toStrictEqual({
      valida: true,
      datos: { ciudad: "Córdoba" },
    });
    expect(validarBusqueda("Córdoba", "   ")).toStrictEqual({
      valida: true,
      datos: { ciudad: "Córdoba" },
    });
  });

  it("normaliza espacios y pasa el país a mayúsculas", () => {
    expect(validarBusqueda("  San José ", " cr ")).toStrictEqual({
      valida: true,
      datos: { ciudad: "San José", pais: "CR" },
    });
  });

  it("acepta letras con tildes, espacios, apóstrofes, puntos y guiones", () => {
    for (const ciudad of ["São Paulo", "L'Aquila", "St. John's", "Castilla-La Mancha", "Zürich"]) {
      expect(validarBusqueda(ciudad, null).valida, ciudad).toBe(true);
    }
  });

  it("rechaza la ciudad vacía o ausente", () => {
    for (const ciudad of [null, "", "   "]) {
      const resultado = validarBusqueda(ciudad, "AR");
      expect(resultado.valida).toBe(false);
      expect(!resultado.valida && resultado.mensaje).toBe("El parámetro ciudad es obligatorio.");
    }
  });

  it("rechaza ciudades con caracteres no permitidos o que no empiezan con letra", () => {
    for (const ciudad of ["123", "Córdoba, AR", "Rosario<script>", "-Rosario", "'Rosario", "Ro;sario"]) {
      const resultado = validarBusqueda(ciudad, null);
      expect(resultado.valida, ciudad).toBe(false);
      expect(!resultado.valida && resultado.mensaje).toBe("El parámetro ciudad no es válido.");
    }
  });

  it("acepta hasta 100 caracteres y rechaza más", () => {
    expect(validarBusqueda("a".repeat(100), null).valida).toBe(true);
    expect(validarBusqueda("a".repeat(101), null).valida).toBe(false);
  });

  it("rechaza un país que no sea un código de 2 letras", () => {
    for (const pais of ["ARG", "A", "A1", "Argentina", "1"]) {
      const resultado = validarBusqueda("Córdoba", pais);
      expect(resultado.valida, pais).toBe(false);
      expect(!resultado.valida && resultado.mensaje).toBe("El parámetro pais debe ser un código de 2 letras (ej: AR).");
    }
  });
});

describe("validarBusqueda con apóstrofes tipográficos", () => {
  it("normaliza ’ (iOS) al apóstrofe recto", () => {
    expect(validarBusqueda("L’Aquila", "IT")).toStrictEqual({
      valida: true,
      datos: { ciudad: "L'Aquila", pais: "IT" },
    });
    expect(validarBusqueda("O‘Higgins", null)).toStrictEqual({
      valida: true,
      datos: { ciudad: "O'Higgins" },
    });
  });

  it("el apóstrofe recto sigue valiendo", () => {
    expect(validarBusqueda("L'Aquila", null).valida).toBe(true);
  });
});

describe("validarCoordenadas", () => {
  it("acepta coordenadas válidas", () => {
    expect(validarCoordenadas("-31.42", "-64.18")).toStrictEqual({
      valida: true,
      datos: { lat: -31.42, lon: -64.18 },
    });
  });

  it("acepta los límites y el cero", () => {
    expect(validarCoordenadas("90", "180").valida).toBe(true);
    expect(validarCoordenadas("-90", "-180").valida).toBe(true);
    expect(validarCoordenadas("0", "0").valida).toBe(true);
  });

  it("rechaza valores faltantes, vacíos o no numéricos", () => {
    expect(validarCoordenadas(null, "10").valida).toBe(false);
    expect(validarCoordenadas("10", "").valida).toBe(false);
    expect(validarCoordenadas("abc", "10").valida).toBe(false);
    expect(validarCoordenadas("1e3", "10").valida).toBe(false);
    expect(validarCoordenadas("Infinity", "10").valida).toBe(false);
  });

  it("rechaza coordenadas fuera de rango", () => {
    expect(validarCoordenadas("90.1", "0").valida).toBe(false);
    expect(validarCoordenadas("0", "-180.5").valida).toBe(false);
  });
});

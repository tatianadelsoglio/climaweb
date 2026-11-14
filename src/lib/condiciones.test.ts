import { describe, expect, it } from "vitest";
import { descripcionCondicion } from "./condiciones";

describe("descripcionCondicion", () => {
  it("grupo 80x: despejado y nubosidad", () => {
    expect(descripcionCondicion(800)).toBe("Despejado");
    expect(descripcionCondicion(801)).toBe("Pocas nubes");
    expect(descripcionCondicion(802)).toBe("Parcialmente nublado");
    expect(descripcionCondicion(803)).toBe("Mayormente nublado");
    expect(descripcionCondicion(804)).toBe("Nublado");
  });

  it("cubre un código de cada grupo", () => {
    expect(descripcionCondicion(211)).toBe("Tormenta");
    expect(descripcionCondicion(301)).toBe("Llovizna");
    expect(descripcionCondicion(501)).toBe("Lluvia moderada");
    expect(descripcionCondicion(601)).toBe("Nevada");
    expect(descripcionCondicion(741)).toBe("Niebla");
  });

  it("un código desconocido usa la descripción de su grupo", () => {
    expect(descripcionCondicion(299)).toBe("Tormenta");
    expect(descripcionCondicion(399)).toBe("Llovizna");
    expect(descripcionCondicion(599)).toBe("Lluvia");
    expect(descripcionCondicion(699)).toBe("Nieve");
    expect(descripcionCondicion(799)).toBe("Visibilidad reducida");
    expect(descripcionCondicion(899)).toBe("Cielo variable");
  });

  it("un código fuera de todos los grupos tiene respaldo", () => {
    expect(descripcionCondicion(0)).toBe("Condición no disponible");
    expect(descripcionCondicion(1234)).toBe("Condición no disponible");
  });

  it("ninguna descripción conocida está vacía ni en minúscula inicial", () => {
    for (let codigo = 200; codigo <= 804; codigo++) {
      const texto = descripcionCondicion(codigo);
      expect(texto, `${codigo}: ${texto}`).toMatch(/^\p{Lu}/u);
    }
  });
});

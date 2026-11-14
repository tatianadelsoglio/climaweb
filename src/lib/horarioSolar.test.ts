import { describe, expect, it } from "vitest";
import { normalizarHorarioSolar } from "./horarioSolar";

describe("normalizarHorarioSolar", () => {
  it("conserva un horario válido", () => {
    expect(normalizarHorarioSolar(1_794_639_576, 1_794_675_542)).toStrictEqual({
      amanecer: 1_794_639_576,
      atardecer: 1_794_675_542,
    });
  });

  it("amanecer y atardecer iguales no son un horario: ambos null", () => {
    expect(normalizarHorarioSolar(1_794_639_576, 1_794_639_576)).toStrictEqual({
      amanecer: null,
      atardecer: null,
    });
  });

  it("faltantes, 0 o inválidos (sol de medianoche, noche polar): ambos null", () => {
    const sinHorario = { amanecer: null, atardecer: null };
    expect(normalizarHorarioSolar(undefined, undefined)).toStrictEqual(sinHorario);
    expect(normalizarHorarioSolar(0, 0)).toStrictEqual(sinHorario);
    expect(normalizarHorarioSolar(1_794_639_576, 0)).toStrictEqual(sinHorario);
    expect(normalizarHorarioSolar(undefined, 1_794_675_542)).toStrictEqual(sinHorario);
    expect(normalizarHorarioSolar("1", "2")).toStrictEqual(sinHorario);
    expect(normalizarHorarioSolar(Number.NaN, 5)).toStrictEqual(sinHorario);
  });
});

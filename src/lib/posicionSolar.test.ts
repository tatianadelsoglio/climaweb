import { describe, expect, it } from "vitest";
import { posicionEnArco, progresoSolar } from "./posicionSolar";

// Córdoba, Argentina (UTC−3), 14/11/2026: amanecer 06:12 y atardecer 19:58 locales.
const CORDOBA = {
  zonaHoraria: -3 * 3600,
  amanecer: Date.UTC(2026, 10, 14, 9, 12) / 1000,
  atardecer: Date.UTC(2026, 10, 14, 22, 58) / 1000,
};
const DURACION_DIA = (19 * 60 + 58 - (6 * 60 + 12)) * 60; // 13 h 46 min

function enCordoba(hora: number, minuto: number) {
  return { ...CORDOBA, momento: Date.UTC(2026, 10, 14, hora + 3, minuto) / 1000 };
}

function cerca(real: number | null, esperado: number) {
  expect(real !== null && Math.abs(real - esperado) < 1e-9, `${real} ≠ ${esperado}`).toBeTruthy();
}

describe("progresoSolar", () => {
  it("0 en el amanecer", () => {
    cerca(progresoSolar(enCordoba(6, 12)), 0);
  });

  it("a mitad del día solar, 0,5", () => {
    // 06:12 + 6 h 53 min = 13:05
    cerca(progresoSolar(enCordoba(13, 5)), 0.5);
  });

  it("proporcional al tiempo transcurrido", () => {
    // 12:42 → 6 h 30 min desde el amanecer.
    cerca(progresoSolar(enCordoba(12, 42)), (6.5 * 3600) / DURACION_DIA);
  });

  it("casi 1 justo antes del atardecer", () => {
    const p = progresoSolar(enCordoba(19, 57));
    expect(p !== null && p > 0.99 && p < 1).toBeTruthy();
  });

  it("de noche no hay progreso (misma lógica que el cielo)", () => {
    expect(progresoSolar(enCordoba(22, 30))).toBe(null);
    expect(progresoSolar(enCordoba(3, 0))).toBe(null);
    expect(progresoSolar(enCordoba(19, 58))).toBe(null); // el atardecer ya es noche
    expect(progresoSolar(enCordoba(5, 59))).toBe(null);
  });

  it("usa la hora de la ciudad, no la del usuario ni UTC", () => {
    // 15:00 UTC es mediodía en Córdoba (12:00) y de noche en Tokio (00:00).
    const mediodiaCordoba = { ...CORDOBA, momento: Date.UTC(2026, 10, 14, 15, 0) / 1000 };
    expect(progresoSolar(mediodiaCordoba) !== null).toBeTruthy();

    const TOKIO = {
      zonaHoraria: 9 * 3600,
      amanecer: Date.UTC(2026, 10, 13, 21, 30) / 1000, // 06:30 local
      atardecer: Date.UTC(2026, 10, 14, 7, 30) / 1000, // 16:30 local
      momento: Date.UTC(2026, 10, 14, 15, 0) / 1000, // 00:00 local
    };
    expect(progresoSolar(TOKIO)).toBe(null);
  });

  it("amanecer y atardecer de otra fecha no importan: se compara la hora del día", () => {
    const ayer = {
      ...enCordoba(13, 5),
      amanecer: CORDOBA.amanecer - 86_400,
      atardecer: CORDOBA.atardecer - 86_400,
    };
    cerca(progresoSolar(ayer), 0.5);
  });

  it("si el día solar cruza la medianoche local, sigue siendo proporcional", () => {
    // Sale 22:00 y se pone 10:00 del día siguiente (hora local; 12 h de día).
    const datos = {
      zonaHoraria: 0,
      amanecer: Date.UTC(2026, 10, 14, 22, 0) / 1000,
      atardecer: Date.UTC(2026, 10, 15, 10, 0) / 1000,
    };
    cerca(progresoSolar({ ...datos, momento: Date.UTC(2026, 10, 15, 4, 0) / 1000 }), 0.5);
    cerca(progresoSolar({ ...datos, momento: Date.UTC(2026, 10, 14, 23, 0) / 1000 }), 1 / 12);
    expect(progresoSolar({ ...datos, momento: Date.UTC(2026, 10, 15, 14, 0) / 1000 })).toBe(null);
  });

  it("sin amanecer o atardecer (día o noche polar) no hay arco", () => {
    const momento = Date.UTC(2026, 10, 14, 15, 0) / 1000;
    expect(progresoSolar({ zonaHoraria: 0, amanecer: null, atardecer: null, momento })).toBe(null);
    expect(progresoSolar({ ...CORDOBA, amanecer: null, momento })).toBe(null);
  });
});

describe("posicionEnArco", () => {
  it("extremos y centro", () => {
    const inicio = posicionEnArco(0);
    expect(Math.abs(inicio.x) < 1e-9 && Math.abs(inicio.y) < 1e-9).toBeTruthy();
    const medio = posicionEnArco(0.5);
    expect(Math.abs(medio.x - 0.5) < 1e-9 && Math.abs(medio.y - 1) < 1e-9).toBeTruthy();
    const fin = posicionEnArco(1);
    expect(Math.abs(fin.x - 1) < 1e-9 && Math.abs(fin.y) < 1e-9).toBeTruthy();
  });

  it("sigue la elipse: no es una recta ni una parábola", () => {
    // A un cuarto del recorrido (45°) el sol ya está al 70,7 % de la altura.
    const { x, y } = posicionEnArco(0.25);
    expect(Math.abs(x - (1 - Math.SQRT1_2) / 2) < 1e-9).toBeTruthy();
    expect(Math.abs(y - Math.SQRT1_2) < 1e-9).toBeTruthy();
  });

  it("coincide con la posición del diseño (progreso 0,69 → sol a x≈0,78 del ancho)", () => {
    // El .pen dibuja el sol a 55,8° del eje derecho: progreso = (180 − 55,8) / 180.
    const { x, y } = posicionEnArco((180 - 55.8) / 180);
    expect(Math.abs(x - (1 + Math.cos((55.8 * Math.PI) / 180)) / 2) < 1e-9).toBeTruthy();
    expect(Math.abs(y - Math.sin((55.8 * Math.PI) / 180)) < 1e-9).toBeTruthy();
  });
});

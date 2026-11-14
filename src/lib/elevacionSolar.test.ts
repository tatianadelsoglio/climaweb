import { describe, expect, it } from "vitest";
import { elevacionSolar, esDeDiaPorElevacion } from "./elevacionSolar";

const TROMSO = { lat: 69.65, lon: 18.96 };
const BUENOS_AIRES = { lat: -34.6, lon: -58.4 };
const ECUADOR = { lat: 0, lon: 0 };

function utc(anio: number, mes: number, dia: number, hora: number, minuto = 0): number {
  return Date.UTC(anio, mes - 1, dia, hora, minuto) / 1000;
}

describe("elevacionSolar (aproximación de ~1°)", () => {
  it("en el ecuador, en el equinoccio y al mediodía solar, el sol está casi en el cenit", () => {
    expect(elevacionSolar(utc(2026, 3, 20, 12), ECUADOR.lat, ECUADOR.lon)).toBeGreaterThan(87);
  });

  it("en el ecuador, a medianoche solar, está bajo el horizonte", () => {
    expect(elevacionSolar(utc(2026, 3, 20, 0), ECUADOR.lat, ECUADOR.lon)).toBeLessThan(-80);
  });

  it("Tromsø en el solsticio de junio: ~44° al mediodía y todavía sobre el horizonte a medianoche", () => {
    // Mediodía solar local ≈ 10:44 UTC; medianoche solar ≈ 22:44 UTC.
    const mediodia = elevacionSolar(utc(2026, 6, 21, 10, 44), TROMSO.lat, TROMSO.lon);
    const medianoche = elevacionSolar(utc(2026, 6, 21, 22, 44), TROMSO.lat, TROMSO.lon);
    expect(mediodia).toBeGreaterThan(42);
    expect(mediodia).toBeLessThan(46);
    expect(medianoche).toBeGreaterThan(1);
    expect(medianoche).toBeLessThan(5);
  });

  it("Tromsø en el solsticio de diciembre: el sol no sale ni al mediodía", () => {
    const mediodia = elevacionSolar(utc(2026, 12, 21, 10, 44), TROMSO.lat, TROMSO.lon);
    expect(mediodia).toBeLessThan(-1);
    expect(mediodia).toBeGreaterThan(-6);
  });

  it("Buenos Aires: alto al mediodía local y bajo el horizonte a medianoche", () => {
    // 12:00 local (UTC−3) = 15:00 UTC.
    expect(elevacionSolar(utc(2026, 11, 14, 15), BUENOS_AIRES.lat, BUENOS_AIRES.lon)).toBeGreaterThan(65);
    expect(elevacionSolar(utc(2026, 11, 14, 3), BUENOS_AIRES.lat, BUENOS_AIRES.lon)).toBeLessThan(-20);
  });

  it("el resultado siempre está entre −90° y 90°", () => {
    for (let hora = 0; hora < 24; hora++) {
      const el = elevacionSolar(utc(2026, 9, 23, hora), 89.9, 120);
      expect(el).toBeGreaterThanOrEqual(-90);
      expect(el).toBeLessThanOrEqual(90);
    }
  });
});

describe("esDeDiaPorElevacion", () => {
  it("sol de medianoche: día a cualquier hora del solsticio de junio en Tromsø", () => {
    for (let hora = 0; hora < 24; hora += 3) {
      expect(esDeDiaPorElevacion(utc(2026, 6, 21, hora), TROMSO.lat, TROMSO.lon)).toBe(true);
    }
  });

  it("noche polar: noche a cualquier hora del solsticio de diciembre en Tromsø", () => {
    for (let hora = 0; hora < 24; hora += 3) {
      expect(esDeDiaPorElevacion(utc(2026, 12, 21, hora), TROMSO.lat, TROMSO.lon)).toBe(false);
    }
  });

  it("latitudes medias: de día a mediodía, de noche a medianoche", () => {
    expect(esDeDiaPorElevacion(utc(2026, 11, 14, 15), BUENOS_AIRES.lat, BUENOS_AIRES.lon)).toBe(true);
    expect(esDeDiaPorElevacion(utc(2026, 11, 14, 3), BUENOS_AIRES.lat, BUENOS_AIRES.lon)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  formatearFechaLocal,
  formatearHoraLocal,
  formatearDiaPronostico,
  formatearPorcentaje,
  formatearTemperatura,
  describirViento,
  formatearOrigenViento,
  formatearVelocidad,
  rotacionFlechaViento,
  nombrePais,
  puntoCardinal,
} from "./formatoClima";

// 14/11/2026 18:42 UTC = sábado 15:42 en Córdoba (UTC−3).
const INSTANTE = Date.UTC(2026, 10, 14, 18, 42) / 1000;
const CORDOBA = -3 * 3600;

describe("formatearTemperatura", () => {
  it("redondea y usa signo menos tipográfico", () => {
    expect(formatearTemperatura(24.4)).toBe("24°");
    expect(formatearTemperatura(-12.4)).toBe("−12°");
    expect(formatearTemperatura(104)).toBe("104°");
  });

  it("no muestra «−0°»", () => {
    expect(formatearTemperatura(-0.4)).toBe("0°");
  });

  it("convierte a Fahrenheit antes de redondear", () => {
    expect(formatearTemperatura(24, "F")).toBe("75°");
    expect(formatearTemperatura(0, "F")).toBe("32°");
    expect(formatearTemperatura(-20, "F")).toBe("−4°");
    expect(formatearTemperatura(21.4, "F")).toBe("71°");
  });
});

describe("fecha y hora locales de la ciudad", () => {
  it("formatea la hora con el huso de la ciudad", () => {
    expect(formatearHoraLocal(INSTANTE, CORDOBA)).toBe("15:42");
    expect(formatearHoraLocal(INSTANTE, 9 * 3600)).toBe("03:42");
  });

  it("formatea la fecha larga y la corta", () => {
    expect(formatearFechaLocal(INSTANTE, CORDOBA, "larga")).toBe("Sábado 14 de noviembre");
    expect(formatearFechaLocal(INSTANTE, CORDOBA, "corta")).toBe("Sáb 14 nov");
  });

  it("cambia de día según el huso", () => {
    expect(formatearFechaLocal(INSTANTE, 9 * 3600, "corta")).toBe("Dom 15 nov");
  });
});

describe("viento y humedad", () => {
  it("convierte grados a punto cardinal de 8 rumbos", () => {
    expect(puntoCardinal(0)).toBe("N");
    expect(puntoCardinal(135)).toBe("SE");
    expect(puntoCardinal(225)).toBe("SO");
    expect(puntoCardinal(315)).toBe("NO");
    expect(puntoCardinal(359)).toBe("N");
    expect(puntoCardinal(-45)).toBe("NO");
  });

  it("formatea la velocidad", () => {
    expect(formatearVelocidad(14.2)).toBe("14 km/h");
    expect(formatearVelocidad(0.4)).toBe("0 km/h");
  });

  it("de dónde viene el viento: «del O» es el oeste, no un cero", () => {
    expect(formatearOrigenViento(270)).toBe("del O");
    expect(formatearOrigenViento(135)).toBe("del SE");
    expect(formatearOrigenViento(0)).toBe("del N");
  });

  it("la flecha apunta hacia donde va el viento (opuesto a su origen)", () => {
    expect(rotacionFlechaViento(0)).toBe(180); // viento del norte → va hacia el sur
    expect(rotacionFlechaViento(270)).toBe(90); // del oeste → va hacia el este
    expect(rotacionFlechaViento(180)).toBe(0);
    expect(rotacionFlechaViento(90)).toBe(270);
    expect(rotacionFlechaViento(359)).toBe(179);
  });

  it("descripción completa para lectores de pantalla", () => {
    expect(describirViento(19, 270)).toBe("Viento de 19 km/h del oeste");
    expect(describirViento(14.2, 135)).toBe("Viento de 14 km/h del sureste");
    expect(describirViento(7, 0)).toBe("Viento de 7 km/h del norte");
    expect(describirViento(7, 315)).toBe("Viento de 7 km/h del noroeste");
    expect(describirViento(9, null)).toBe("Viento de 9 km/h");
    expect(describirViento(9, -90)).toBe("Viento de 9 km/h del oeste");
  });

  it("formatea un porcentaje", () => {
    expect(formatearPorcentaje(58)).toBe("58 %");
  });
});

describe("formatearDiaPronostico", () => {
  it("usa el día de la semana y el número de la fecha local", () => {
    expect(formatearDiaPronostico("2026-11-15", true)).toBe("Dom 15");
    expect(formatearDiaPronostico("2026-11-15", false)).toBe("Dom");
    expect(formatearDiaPronostico("2026-11-14", true)).toBe("Sáb 14");
  });

  it("cruza el fin de mes y de año", () => {
    expect(formatearDiaPronostico("2026-11-30", true)).toBe("Lun 30");
    expect(formatearDiaPronostico("2026-12-01", true)).toBe("Mar 1");
    expect(formatearDiaPronostico("2027-01-01", true)).toBe("Vie 1");
  });
});

describe("nombrePais", () => {
  it("traduce el código ISO al nombre en español", () => {
    expect(nombrePais("AR")).toBe("Argentina");
    expect(nombrePais("es")).toBe("España");
  });

  it("devuelve el código si no es válido", () => {
    expect(nombrePais("1")).toBe("1");
  });
});

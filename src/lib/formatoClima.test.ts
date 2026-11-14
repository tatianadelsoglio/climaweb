import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
} from "./formatoClima.ts";

// 14/11/2026 18:42 UTC = sábado 15:42 en Córdoba (UTC−3).
const INSTANTE = Date.UTC(2026, 10, 14, 18, 42) / 1000;
const CORDOBA = -3 * 3600;

describe("formatearTemperatura", () => {
  it("redondea y usa signo menos tipográfico", () => {
    assert.equal(formatearTemperatura(24.4), "24°");
    assert.equal(formatearTemperatura(-12.4), "−12°");
    assert.equal(formatearTemperatura(104), "104°");
  });

  it("no muestra «−0°»", () => {
    assert.equal(formatearTemperatura(-0.4), "0°");
  });

  it("convierte a Fahrenheit antes de redondear", () => {
    assert.equal(formatearTemperatura(24, "F"), "75°");
    assert.equal(formatearTemperatura(0, "F"), "32°");
    assert.equal(formatearTemperatura(-20, "F"), "−4°");
    assert.equal(formatearTemperatura(21.4, "F"), "71°");
  });
});

describe("fecha y hora locales de la ciudad", () => {
  it("formatea la hora con el huso de la ciudad", () => {
    assert.equal(formatearHoraLocal(INSTANTE, CORDOBA), "15:42");
    assert.equal(formatearHoraLocal(INSTANTE, 9 * 3600), "03:42");
  });

  it("formatea la fecha larga y la corta", () => {
    assert.equal(formatearFechaLocal(INSTANTE, CORDOBA, "larga"), "Sábado 14 de noviembre");
    assert.equal(formatearFechaLocal(INSTANTE, CORDOBA, "corta"), "Sáb 14 nov");
  });

  it("cambia de día según el huso", () => {
    assert.equal(formatearFechaLocal(INSTANTE, 9 * 3600, "corta"), "Dom 15 nov");
  });
});

describe("viento y humedad", () => {
  it("convierte grados a punto cardinal de 8 rumbos", () => {
    assert.equal(puntoCardinal(0), "N");
    assert.equal(puntoCardinal(135), "SE");
    assert.equal(puntoCardinal(225), "SO");
    assert.equal(puntoCardinal(315), "NO");
    assert.equal(puntoCardinal(359), "N");
    assert.equal(puntoCardinal(-45), "NO");
  });

  it("formatea la velocidad", () => {
    assert.equal(formatearVelocidad(14.2), "14 km/h");
    assert.equal(formatearVelocidad(0.4), "0 km/h");
  });

  it("de dónde viene el viento: «del O» es el oeste, no un cero", () => {
    assert.equal(formatearOrigenViento(270), "del O");
    assert.equal(formatearOrigenViento(135), "del SE");
    assert.equal(formatearOrigenViento(0), "del N");
  });

  it("la flecha apunta hacia donde va el viento (opuesto a su origen)", () => {
    assert.equal(rotacionFlechaViento(0), 180); // viento del norte → va hacia el sur
    assert.equal(rotacionFlechaViento(270), 90); // del oeste → va hacia el este
    assert.equal(rotacionFlechaViento(180), 0);
    assert.equal(rotacionFlechaViento(90), 270);
    assert.equal(rotacionFlechaViento(359), 179);
  });

  it("descripción completa para lectores de pantalla", () => {
    assert.equal(describirViento(19, 270), "Viento de 19 km/h del oeste");
    assert.equal(describirViento(14.2, 135), "Viento de 14 km/h del sureste");
    assert.equal(describirViento(7, 0), "Viento de 7 km/h del norte");
    assert.equal(describirViento(7, 315), "Viento de 7 km/h del noroeste");
    assert.equal(describirViento(9, null), "Viento de 9 km/h");
    assert.equal(describirViento(9, -90), "Viento de 9 km/h del oeste");
  });

  it("formatea un porcentaje", () => {
    assert.equal(formatearPorcentaje(58), "58 %");
  });
});

describe("formatearDiaPronostico", () => {
  it("usa el día de la semana y el número de la fecha local", () => {
    assert.equal(formatearDiaPronostico("2026-11-15", true), "Dom 15");
    assert.equal(formatearDiaPronostico("2026-11-15", false), "Dom");
    assert.equal(formatearDiaPronostico("2026-11-14", true), "Sáb 14");
  });

  it("cruza el fin de mes y de año", () => {
    assert.equal(formatearDiaPronostico("2026-11-30", true), "Lun 30");
    assert.equal(formatearDiaPronostico("2026-12-01", true), "Mar 1");
    assert.equal(formatearDiaPronostico("2027-01-01", true), "Vie 1");
  });
});

describe("nombrePais", () => {
  it("traduce el código ISO al nombre en español", () => {
    assert.equal(nombrePais("AR"), "Argentina");
    assert.equal(nombrePais("es"), "España");
  });

  it("devuelve el código si no es válido", () => {
    assert.equal(nombrePais("1"), "1");
  });
});

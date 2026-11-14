import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatearFechaLocal,
  formatearHoraLocal,
  formatearDiaPronostico,
  formatearHumedad,
  formatearTemperatura,
  formatearViento,
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

  it("formatea velocidad con o sin dirección", () => {
    assert.equal(formatearViento(14.2, 135), "14 km/h SE");
    assert.equal(formatearViento(9, null), "9 km/h");
  });

  it("formatea la humedad", () => {
    assert.equal(formatearHumedad(58), "58 %");
  });
});

describe("formatearDiaPronostico", () => {
  it("usa el día de la semana y el número en el huso de la ciudad", () => {
    // 15/11/2026 15:00 UTC = domingo 12:00 en Córdoba.
    const domingo = Date.UTC(2026, 10, 15, 15, 0) / 1000;
    assert.equal(formatearDiaPronostico(domingo, CORDOBA, true), "Dom 15");
    assert.equal(formatearDiaPronostico(domingo, CORDOBA, false), "Dom");
  });

  it("respeta el huso: cerca de la medianoche UTC el día local es otro", () => {
    // 16/11/2026 01:00 UTC = domingo 22:00 en Córdoba, pero lunes en Madrid.
    const instante = Date.UTC(2026, 10, 16, 1, 0) / 1000;
    assert.equal(formatearDiaPronostico(instante, CORDOBA, true), "Dom 15");
    assert.equal(formatearDiaPronostico(instante, 3600, true), "Lun 16");
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

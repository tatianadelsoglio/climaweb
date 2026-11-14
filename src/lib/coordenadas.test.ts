import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatearCoordenada } from "./coordenadas.ts";

describe("formatearCoordenada", () => {
  it("usa 4 decimales", () => {
    assert.equal(formatearCoordenada(-31.4173391), "-31.4173");
    assert.equal(formatearCoordenada(40.7), "40.7000");
  });

  it("nunca usa notación científica", () => {
    assert.equal(formatearCoordenada(0.00000001), "0.0000");
    assert.equal(formatearCoordenada(1e-8), "0.0000");
    assert.ok(!/e/i.test(formatearCoordenada(123456789e-12)));
  });

  it("no devuelve «-0.0000»", () => {
    assert.equal(formatearCoordenada(-0.00001), "0.0000");
    assert.equal(formatearCoordenada(-0), "0.0000");
  });

  it("conserva los límites", () => {
    assert.equal(formatearCoordenada(90), "90.0000");
    assert.equal(formatearCoordenada(-180), "-180.0000");
  });
});

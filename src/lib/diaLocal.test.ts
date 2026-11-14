import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { claveDiaLocal, separarHoy } from "./diaLocal.ts";
import type { DiaPronostico } from "../types/clima.ts";

const CORDOBA = -3 * 3600;
const TOKIO = 9 * 3600;

function dia(fecha: string): DiaPronostico {
  return { fecha, minima: 10, maxima: 20, codigo: 800, probabilidadLluvia: 0 };
}
const SEMANA = ["2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17"].map(dia);
// Sábado 14/11/2026 15:42 en Córdoba.
const SABADO = Date.UTC(2026, 10, 14, 18, 42) / 1000;

describe("claveDiaLocal", () => {
  it("usa el día de la ciudad, no el de UTC", () => {
    const instante = Date.UTC(2026, 10, 15, 1, 0) / 1000; // 01:00 UTC del 15
    assert.equal(claveDiaLocal(instante, CORDOBA), "2026-11-14");
    assert.equal(claveDiaLocal(instante, TOKIO), "2026-11-15");
  });
});

describe("separarHoy", () => {
  it("el primer día es hoy: lo separa de los siguientes", () => {
    const { hoy, siguientes } = separarHoy(SEMANA, SABADO, CORDOBA);
    assert.equal(hoy?.fecha, "2026-11-14");
    assert.deepEqual(
      siguientes.map((d) => d.fecha),
      ["2026-11-15", "2026-11-16", "2026-11-17"],
    );
  });

  it("si el primer día vino inválido (descartado), hoy es null y no se corren las etiquetas", () => {
    const sinHoy = SEMANA.slice(1);
    const { hoy, siguientes } = separarHoy(sinHoy, SABADO, CORDOBA);
    assert.equal(hoy, null);
    assert.equal(siguientes[0].fecha, "2026-11-15");
    assert.equal(siguientes.length, 3);
  });

  it("caché de ayer después de la medianoche local: descarta ayer y usa el de hoy", () => {
    // Domingo 00:30 en Córdoba; la respuesta cacheada empieza el sábado.
    const domingo = Date.UTC(2026, 10, 15, 3, 30) / 1000;
    const { hoy, siguientes } = separarHoy(SEMANA, domingo, CORDOBA);
    assert.equal(hoy?.fecha, "2026-11-15");
    assert.deepEqual(
      siguientes.map((d) => d.fecha),
      ["2026-11-16", "2026-11-17"],
    );
  });

  it("caché que ya no cubre hoy: hoy es null", () => {
    const miercoles = Date.UTC(2026, 10, 18, 18, 0) / 1000;
    const { hoy, siguientes } = separarHoy(SEMANA, miercoles, CORDOBA);
    assert.equal(hoy, null);
    assert.deepEqual(siguientes, []);
  });

  it("compara con el día local de la ciudad: a las 22:00 en Córdoba ya es lunes en Tokio", () => {
    const instante = Date.UTC(2026, 10, 16, 1, 0) / 1000; // dom 22:00 Córdoba / lun 10:00 Tokio
    assert.equal(separarHoy(SEMANA, instante, CORDOBA).hoy?.fecha, "2026-11-15");
    assert.equal(separarHoy(SEMANA, instante, TOKIO).hoy?.fecha, "2026-11-16");
  });

  it("sin días no hay hoy ni siguientes", () => {
    assert.deepEqual(separarHoy([], SABADO, CORDOBA), { hoy: null, siguientes: [] });
  });
});

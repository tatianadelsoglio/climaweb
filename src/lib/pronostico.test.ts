import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  agruparPorDiaLocal,
  claveDiaLocal,
  extraerFranjas,
  resumenDeHoy,
  type FranjaPronostico,
} from "./pronostico.ts";

const CORDOBA = -3 * 3600;
const TOKIO = 9 * 3600;
const TRES_HORAS = 3 * 3600;
// Sábado 14/11/2026 15:42 en Córdoba.
const MOMENTO = Date.UTC(2026, 10, 14, 18, 42) / 1000;

/** Franjas de 3 h desde `inicio`; la temperatura sube y baja según la hora UTC. */
function franjas(inicio: number, cantidad: number, zonaHoraria: number): FranjaPronostico[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const instante = inicio + i * TRES_HORAS;
    const hora = ((instante + zonaHoraria) / 3600) % 24;
    const temperatura = 10 + (hora >= 0 ? hora : hora + 24); // 10° a medianoche, 33° a las 23
    return {
      instante,
      temperatura,
      minima: temperatura - 1,
      maxima: temperatura + 1,
      codigo: 800 + (i % 5),
      probabilidadLluvia: (i * 10) % 100,
    };
  });
}

// La API arranca en la próxima franja: 18:00 local del sábado.
const PRIMERA_FRANJA = Date.UTC(2026, 10, 14, 21, 0) / 1000;

describe("claveDiaLocal", () => {
  it("usa el día de la ciudad, no el de UTC", () => {
    // 15/11 01:00 UTC es todavía el 14 en Córdoba y ya el 15 en Tokio.
    const instante = Date.UTC(2026, 10, 15, 1, 0) / 1000;
    assert.equal(claveDiaLocal(instante, CORDOBA), "2026-11-14");
    assert.equal(claveDiaLocal(instante, TOKIO), "2026-11-15");
  });
});

describe("agruparPorDiaLocal", () => {
  it("devuelve 5 días sin contar hoy, con fechas locales consecutivas", () => {
    const dias = agruparPorDiaLocal(franjas(PRIMERA_FRANJA, 40, CORDOBA), CORDOBA, MOMENTO);
    assert.deepEqual(
      dias.map((d) => d.fecha),
      ["2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"],
    );
  });

  it("calcula mínima y máxima del día local", () => {
    const dias = agruparPorDiaLocal(franjas(PRIMERA_FRANJA, 40, CORDOBA), CORDOBA, MOMENTO);
    // Día 15 completo: 00:00 → 21:00 local. La temperatura es 10 + hora.
    assert.equal(dias[0].minima, 9); // 00:00 → 10 − 1
    assert.equal(dias[0].maxima, 32); // 21:00 → 31 + 1
  });

  it("toma el ícono de la franja más cercana al mediodía local", () => {
    const todas = franjas(PRIMERA_FRANJA, 40, CORDOBA);
    const dias = agruparPorDiaLocal(todas, CORDOBA, MOMENTO);
    const mediodia = todas.find(
      (f) => f.instante === Date.UTC(2026, 10, 15, 15, 0) / 1000, // 12:00 local
    );
    assert.ok(mediodia);
    assert.equal(dias[0].codigo, mediodia.codigo);
    assert.equal(dias[0].instante, mediodia.instante);
  });

  it("la probabilidad de lluvia es la mayor del día", () => {
    const base: FranjaPronostico = {
      instante: 0,
      temperatura: 20,
      minima: 20,
      maxima: 20,
      codigo: 500,
      probabilidadLluvia: 0,
    };
    const manana = Date.UTC(2026, 10, 15, 6, 0) / 1000; // 03:00 local del 15
    const delDia = [0, 30, 80, 10].map((p, i) => ({
      ...base,
      instante: manana + i * TRES_HORAS,
      probabilidadLluvia: p,
    }));
    const [dia] = agruparPorDiaLocal(delDia, CORDOBA, MOMENTO);
    assert.equal(dia.probabilidadLluvia, 80);
  });

  it("agrupa con el huso de la ciudad: la franja de 22:00 local no pasa al día siguiente", () => {
    // 16/11 01:00 UTC = domingo 22:00 en Córdoba, pero lunes 10:00 en Tokio.
    const instante = Date.UTC(2026, 10, 16, 1, 0) / 1000;
    const franja: FranjaPronostico = {
      instante,
      temperatura: 18,
      minima: 18,
      maxima: 18,
      codigo: 800,
      probabilidadLluvia: 0,
    };
    const resto = franjas(instante + TRES_HORAS, 3, CORDOBA);
    const dias = agruparPorDiaLocal([franja, ...resto], CORDOBA, MOMENTO);
    assert.equal(dias[0].fecha, "2026-11-15");
    assert.equal(dias[1].fecha, "2026-11-16");
  });

  it("excluye las franjas de hoy", () => {
    const dias = agruparPorDiaLocal(franjas(PRIMERA_FRANJA, 3, CORDOBA), CORDOBA, MOMENTO);
    assert.ok(dias.every((d) => d.fecha > "2026-11-14"));
  });

  it("el último día sale con las franjas que haya, aunque sea una sola", () => {
    // 4 días completos (32 franjas) + 2 de hoy + 1 del quinto.
    const todas = franjas(PRIMERA_FRANJA, 2 + 8 * 4 + 1, CORDOBA);
    const dias = agruparPorDiaLocal(todas, CORDOBA, MOMENTO);
    assert.equal(dias.length, 5);
    assert.equal(dias[4].fecha, "2026-11-19");
    assert.equal(dias[4].codigo, todas.at(-1)?.codigo);
  });

  it("con las 40 franjas de la API siempre hay 5 días, a cualquier hora local", () => {
    // La API arranca en la próxima franja de 3 h: probamos las 8 posibles y varios husos.
    for (const zona of [CORDOBA, TOKIO, 0, 5.5 * 3600, -9.5 * 3600]) {
      for (let hora = 0; hora < 24; hora++) {
        const momento = Date.UTC(2026, 10, 14, hora, 20) / 1000 - zona + 0;
        // Primera franja: la siguiente hora local múltiplo de 3 a partir de "ahora".
        const localAhora = (momento + zona) % 86_400;
        const siguiente = Math.ceil((localAhora + 1) / 10_800) * 10_800;
        const inicio = momento + (siguiente - localAhora);
        const dias = agruparPorDiaLocal(franjas(inicio, 40, zona), zona, momento);
        assert.equal(dias.length, 5, `huso ${zona}, hora local ${hora}:20`);
        for (let i = 1; i < dias.length; i++) assert.ok(dias[i].fecha > dias[i - 1].fecha);
        assert.ok(dias.every((d) => d.fecha > claveDiaLocal(momento, zona)));
      }
    }
  });

  it("sin franjas no hay días", () => {
    assert.deepEqual(agruparPorDiaLocal([], CORDOBA, MOMENTO), []);
  });
});

describe("extraerFranjas", () => {
  const item = {
    dt: 1_000,
    main: { temp: 20.5, temp_min: 19, temp_max: 22 },
    weather: [{ id: 801 }],
    pop: 0.35,
  };

  it("normaliza una franja y pasa pop a porcentaje", () => {
    assert.deepEqual(extraerFranjas({ list: [item] }), [
      {
        instante: 1_000,
        temperatura: 20.5,
        minima: 19,
        maxima: 22,
        codigo: 801,
        probabilidadLluvia: 35,
      },
    ]);
  });

  it("si falta pop, la probabilidad es 0", () => {
    const sinPop = { ...item, pop: undefined };
    assert.equal(extraerFranjas({ list: [sinPop] })[0].probabilidadLluvia, 0);
  });

  it("descarta los elementos inválidos y ordena por instante", () => {
    const resultado = extraerFranjas({
      list: [{ ...item, dt: 3_000 }, { dt: "x" }, null, { ...item, dt: 2_000 }],
    });
    assert.deepEqual(
      resultado.map((f) => f.instante),
      [2_000, 3_000],
    );
  });

  it("una respuesta sin lista da un arreglo vacío", () => {
    assert.deepEqual(extraerFranjas(null), []);
    assert.deepEqual(extraerFranjas({}), []);
  });
});

describe("resumenDeHoy", () => {
  // Córdoba, sábado 14/11 15:42. Franjas de hoy: 18:00 y 21:00 locales.
  const base = { codigo: 800, probabilidadLluvia: 0 };
  const hoy18 = { ...base, instante: Date.UTC(2026, 10, 14, 21, 0) / 1000, temperatura: 26, minima: 25, maxima: 27 };
  const hoy21 = { ...base, instante: Date.UTC(2026, 10, 15, 0, 0) / 1000, temperatura: 20, minima: 19, maxima: 21, probabilidadLluvia: 40 };
  const manana00 = { ...base, instante: Date.UTC(2026, 10, 15, 3, 0) / 1000, temperatura: 12, minima: 11, maxima: 13, probabilidadLluvia: 90 };
  const respaldo = { minima: 21, maxima: 24 };

  it("usa las franjas del día local junto con la temperatura actual", () => {
    const r = resumenDeHoy([hoy18, hoy21, manana00], CORDOBA, MOMENTO, { temperatura: 24, respaldo });
    assert.equal(r.minima, 19);
    assert.equal(r.maxima, 27);
  });

  it("la temperatura actual puede ser el extremo", () => {
    const r = resumenDeHoy([hoy18, hoy21], CORDOBA, MOMENTO, { temperatura: 31, respaldo });
    assert.equal(r.maxima, 31);
    const fria = resumenDeHoy([hoy18, hoy21], CORDOBA, MOMENTO, { temperatura: 15, respaldo });
    assert.equal(fria.minima, 15);
  });

  it("no cuenta franjas de mañana aunque sean de la misma fecha UTC", () => {
    // 15/11 03:00 UTC es 00:00 del 15 en Córdoba: mañana, no hoy.
    const r = resumenDeHoy([hoy18, manana00], CORDOBA, MOMENTO, { temperatura: 24, respaldo });
    assert.equal(r.minima, 24);
  });

  it("la probabilidad de lluvia sale de la franja más cercana", () => {
    const r = resumenDeHoy([hoy18, hoy21, manana00], CORDOBA, MOMENTO, { temperatura: 24, respaldo });
    assert.equal(r.probabilidadLluvia, 0); // 18:00 está a 2 h 18 min; 21:00, a 5 h 18 min
  });

  it("de noche tarde, sin franjas de hoy, usa el respaldo ampliado con la temperatura actual", () => {
    // 23:30 local del sábado: la próxima franja ya es del domingo.
    const tarde = Date.UTC(2026, 10, 15, 2, 30) / 1000;
    const r = resumenDeHoy([manana00], CORDOBA, tarde, { temperatura: 22, respaldo });
    assert.equal(r.minima, 21);
    assert.equal(r.maxima, 24);
    assert.equal(r.probabilidadLluvia, 90);

    const calida = resumenDeHoy([manana00], CORDOBA, tarde, { temperatura: 26, respaldo });
    assert.equal(calida.maxima, 26);
  });

  it("sin pronóstico alcanza con el respaldo y no hay probabilidad de lluvia", () => {
    const r = resumenDeHoy([], CORDOBA, MOMENTO, { temperatura: 23, respaldo });
    assert.deepEqual(r, { minima: 21, maxima: 24, probabilidadLluvia: null });
  });
});

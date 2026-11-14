import { describe, expect, it } from "vitest";
import { esDeDia, resolverCielo } from "./resolverCielo";

// Córdoba, Argentina (UTC−3), 14/11/2026: amanecer 06:12 y atardecer 19:58 locales.
const CORDOBA = {
  zonaHoraria: -3 * 3600,
  amanecer: Date.UTC(2026, 10, 14, 9, 12) / 1000,
  atardecer: Date.UTC(2026, 10, 14, 22, 58) / 1000,
};
const MEDIODIA_CORDOBA = Date.UTC(2026, 10, 14, 15, 42) / 1000; // 12:42 local
const NOCHE_CORDOBA = Date.UTC(2026, 10, 15, 1, 30) / 1000; // 22:30 local

function datos(codigo: number, momento: number, extra: Partial<typeof CORDOBA> = {}) {
  return {
    condicion: { codigo },
    momento,
    ...CORDOBA,
    ...extra,
  };
}

describe("resolverCielo", () => {
  it("800 → clear de día y de noche", () => {
    expect(resolverCielo(datos(800, MEDIODIA_CORDOBA))).toBe("clear-day");
    expect(resolverCielo(datos(800, NOCHE_CORDOBA))).toBe("clear-night");
  });

  it("801 (pocas nubes) → clear de día y de noche", () => {
    expect(resolverCielo(datos(801, MEDIODIA_CORDOBA))).toBe("clear-day");
    expect(resolverCielo(datos(801, NOCHE_CORDOBA))).toBe("clear-night");
  });

  it("802 a 804 → clouds de día y de noche", () => {
    for (const codigo of [802, 803, 804]) {
      expect(resolverCielo(datos(codigo, MEDIODIA_CORDOBA))).toBe("clouds-day");
      expect(resolverCielo(datos(codigo, NOCHE_CORDOBA))).toBe("clouds-night");
    }
  });

  it("2xx → storm, 3xx y 5xx → rain, 6xx → snow, 7xx → mist (sin variante de noche)", () => {
    const casos = [
      [200, "storm"],
      [232, "storm"],
      [300, "rain"],
      [321, "rain"],
      [500, "rain"],
      [531, "rain"],
      [600, "snow"],
      [622, "snow"],
      [701, "mist"],
      [781, "mist"],
    ] as const;
    for (const [codigo, cielo] of casos) {
      expect(resolverCielo(datos(codigo, MEDIODIA_CORDOBA))).toBe(cielo);
      expect(resolverCielo(datos(codigo, NOCHE_CORDOBA))).toBe(cielo);
    }
  });

  it("un código desconocido cae en clear", () => {
    expect(resolverCielo(datos(999, MEDIODIA_CORDOBA))).toBe("clear-day");
  });
});

/** Todos los códigos de condición publicados por OpenWeather (Current Weather 2.5). */
const CODIGOS_OPENWEATHER = {
  tormenta: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232],
  llovizna: [300, 301, 302, 310, 311, 312, 313, 314, 321],
  lluvia: [500, 501, 502, 503, 504, 511, 520, 521, 522, 531],
  nieve: [600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622],
  atmosfera: [701, 711, 721, 731, 741, 751, 761, 762, 771, 781],
  despejado: [800],
  pocasNubes: [801],
  nubes: [802, 803, 804],
} as const;

describe("mapeo de todos los códigos de OpenWeather a cielos", () => {
  const esperado: Record<keyof typeof CODIGOS_OPENWEATHER, [dia: string, noche: string]> = {
    tormenta: ["storm", "storm"],
    llovizna: ["rain", "rain"],
    lluvia: ["rain", "rain"],
    nieve: ["snow", "snow"],
    atmosfera: ["mist", "mist"],
    despejado: ["clear-day", "clear-night"],
    pocasNubes: ["clear-day", "clear-night"],
    nubes: ["clouds-day", "clouds-night"],
  };

  for (const [grupo, codigos] of Object.entries(CODIGOS_OPENWEATHER)) {
    const [dia, noche] = esperado[grupo as keyof typeof CODIGOS_OPENWEATHER];
    it(`${grupo} (${codigos[0]}–${codigos.at(-1)}) → ${dia} / ${noche}`, () => {
      for (const codigo of codigos) {
        expect(resolverCielo(datos(codigo, MEDIODIA_CORDOBA)), `${codigo} de día`).toBe(dia);
        expect(resolverCielo(datos(codigo, NOCHE_CORDOBA)), `${codigo} de noche`).toBe(noche);
      }
    });
  }
});

describe("esDeDia", () => {
  it("usa los límites exactos: amanecer incluido, atardecer excluido", () => {
    expect(esDeDia(datos(800, CORDOBA.amanecer - 1))).toBe(false);
    expect(esDeDia(datos(800, CORDOBA.amanecer))).toBe(true);
    expect(esDeDia(datos(800, CORDOBA.atardecer - 1))).toBe(true);
    expect(esDeDia(datos(800, CORDOBA.atardecer))).toBe(false);
  });

  it("usa el huso de la ciudad, no el del usuario", () => {
    // Tokio (UTC+9): 03:00 UTC son las 12:00 locales.
    const tokio = {
      zonaHoraria: 9 * 3600,
      amanecer: Date.UTC(2026, 10, 13, 21, 14) / 1000, // 06:14 local
      atardecer: Date.UTC(2026, 10, 14, 7, 35) / 1000, // 16:35 local
    };
    const mediodiaTokio = Date.UTC(2026, 10, 14, 3, 0) / 1000;
    expect(esDeDia({ ...tokio, momento: mediodiaTokio })).toBe(true);
    // Ese mismo instante es de noche en Córdoba (00:00 local).
    expect(esDeDia(datos(800, mediodiaTokio))).toBe(false);
  });

  it("compara horas locales aunque el amanecer informado sea de otra fecha", () => {
    // Amanecer del día siguiente: sigue siendo de día a las 12:42.
    const amanecerManiana = CORDOBA.amanecer + 86_400;
    expect(esDeDia(datos(800, MEDIODIA_CORDOBA, { amanecer: amanecerManiana }))).toBe(true);
  });

  it("sin amanecer ni atardecer (polar) usa la hora local de la ciudad", () => {
    const polar = { amanecer: null, atardecer: null, zonaHoraria: 0 };
    expect(esDeDia({ ...polar, momento: Date.UTC(2026, 5, 21, 12) / 1000 })).toBe(true);
    expect(esDeDia({ ...polar, momento: Date.UTC(2026, 5, 21, 23) / 1000 })).toBe(false);
  });

  it("husos con media hora y desplazamientos que cruzan la medianoche", () => {
    // India (UTC+5:30): 18:30 UTC del 13/11 son las 00:00 del 14/11 local.
    const india = {
      zonaHoraria: 5.5 * 3600,
      amanecer: Date.UTC(2026, 10, 14, 0, 50) / 1000, // 06:20 local
      atardecer: Date.UTC(2026, 10, 14, 12, 10) / 1000, // 17:40 local
    };
    expect(esDeDia({ ...india, momento: Date.UTC(2026, 10, 13, 18, 30) / 1000 })).toBe(false);
    expect(esDeDia({ ...india, momento: Date.UTC(2026, 10, 14, 6, 0) / 1000 })).toBe(true);
  });
});

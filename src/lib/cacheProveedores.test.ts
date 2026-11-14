import { describe, expect, it } from "vitest";
import {
  TTL,
  cabeceraCacheCdn,
  normalizarTexto,
  opcionesDeCache,
} from "./cacheProveedores";

describe("TTL por tipo de dato", () => {
  it("clima 10 min, pronóstico 30 min, geocoding 24 h", () => {
    expect(TTL.clima).toBe(600);
    expect(TTL.pronostico).toBe(1800);
    expect(TTL.geocoding).toBe(86_400);
  });
});

describe("opcionesDeCache", () => {
  it("pide a Next que cachee la respuesta ese tiempo", () => {
    expect(opcionesDeCache(TTL.clima)).toStrictEqual({ next: { revalidate: 600 } });
  });
});

describe("cabeceraCacheCdn", () => {
  it("s-maxage con el TTL y stale-while-revalidate con la mitad", () => {
    expect(cabeceraCacheCdn(600)).toBe("public, s-maxage=600, stale-while-revalidate=300");
    expect(cabeceraCacheCdn(86_400)).toBe("public, s-maxage=86400, stale-while-revalidate=43200");
  });

  it("no define max-age: el navegador no cachea por su cuenta", () => {
    expect(cabeceraCacheCdn(1800)).not.toContain("max-age=");
  });
});

describe("normalizarTexto", () => {
  it("quita espacios de más y pasa a minúsculas", () => {
    expect(normalizarTexto("  Nueva   York ")).toBe("nueva york");
    expect(normalizarTexto("CÓRDOBA")).toBe("córdoba");
  });

  it("consultas equivalentes dan la misma clave", () => {
    expect(normalizarTexto("Buenos  Aires")).toBe(normalizarTexto(" buenos aires "));
  });

  it("conserva las tildes (son parte del nombre)", () => {
    expect(normalizarTexto("Tucumán")).not.toBe(normalizarTexto("Tucuman"));
  });
});

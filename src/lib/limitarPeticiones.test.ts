import { describe, expect, it } from "vitest";
import { AlmacenEnMemoria, type AlmacenLimite } from "./rateLimit";
import { LIMITES, ipDelCliente, limitarPorIp } from "./limitarPeticiones";

function pedido(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/weather?ciudad=Madrid", { headers });
}

describe("ipDelCliente", () => {
  it("toma el primer valor de x-forwarded-for", () => {
    expect(ipDelCliente(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe(
      "203.0.113.7",
    );
  });

  it("sin x-forwarded-for usa x-real-ip", () => {
    expect(ipDelCliente(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
  });

  it("sin encabezados (o vacíos), no hay IP conocida", () => {
    expect(ipDelCliente(new Headers())).toBeNull();
    expect(ipDelCliente(new Headers({ "x-forwarded-for": " " }))).toBeNull();
    expect(ipDelCliente(new Headers({ "x-real-ip": "  " }))).toBeNull();
  });

  it("ignora los espacios y los valores siguientes de x-forwarded-for", () => {
    expect(ipDelCliente(new Headers({ "x-forwarded-for": "  203.0.113.7  ,10.0.0.1,10.0.0.2" }))).toBe(
      "203.0.113.7",
    );
  });
});

describe("limitarPorIp", () => {
  it("deja pasar mientras haya fichas", async () => {
    const almacen = new AlmacenEnMemoria();
    const respuesta = await limitarPorIp(
      pedido({ "x-forwarded-for": "1.1.1.1" }),
      "weather",
      almacen,
      0,
    );
    expect(respuesta).toBeNull();
  });

  it("responde 429 con Retry-After y el contrato de error cuando se pasa", async () => {
    const almacen = new AlmacenEnMemoria();
    const ip = { "x-forwarded-for": "1.1.1.1" };
    for (let i = 0; i < LIMITES.weather.capacidad; i++) {
      await limitarPorIp(pedido(ip), "weather", almacen, 0);
    }

    const respuesta = await limitarPorIp(pedido(ip), "weather", almacen, 0);
    expect(respuesta?.status).toBe(429);
    expect(Number(respuesta?.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
    expect(respuesta?.headers.get("Cache-Control")).toBe("no-store");
    const cuerpo = await respuesta?.json();
    expect(cuerpo.error.codigo).toBe("LIMITE_DE_CONSULTAS");
    expect(cuerpo.error.mensaje).toContain("segundos");
  });

  it("sin IP conocida no limita nunca (no se comparte un cubo entre todos)", async () => {
    const almacen = new AlmacenEnMemoria();
    for (let i = 0; i < LIMITES.weather.capacidad * 3; i++) {
      expect(await limitarPorIp(pedido(), "weather", almacen, 0)).toBeNull();
    }
    expect(almacen.tamano).toBe(0);
  });

  it("cada ruta y cada IP tienen su propio cubo", async () => {
    const almacen = new AlmacenEnMemoria();
    const ip = { "x-forwarded-for": "1.1.1.1" };
    for (let i = 0; i < LIMITES.weather.capacidad; i++) {
      await limitarPorIp(pedido(ip), "weather", almacen, 0);
    }
    expect((await limitarPorIp(pedido(ip), "weather", almacen, 0))?.status).toBe(429);
    expect(await limitarPorIp(pedido(ip), "forecast", almacen, 0)).toBeNull();
    const otraIp = pedido({ "x-forwarded-for": "2.2.2.2" });
    expect(await limitarPorIp(otraIp, "weather", almacen, 0)).toBeNull();
  });

  it("funciona con un almacén asíncrono (la interfaz admite uno externo)", async () => {
    const externo: AlmacenLimite = {
      consumir: async () => ({ permitido: false, reintentarEnSegundos: 7 }),
    };
    const respuesta = await limitarPorIp(
      pedido({ "x-forwarded-for": "1.1.1.1" }),
      "geocode",
      externo,
      0,
    );
    expect(respuesta?.status).toBe(429);
    expect(respuesta?.headers.get("Retry-After")).toBe("7");
  });

  it("el autocompletado admite más ráfaga que el clima", () => {
    expect(LIMITES.geocode.capacidad).toBeGreaterThan(LIMITES.weather.capacidad);
  });
});

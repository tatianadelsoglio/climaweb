import { describe, expect, it } from "vitest";
import { AlmacenEnMemoria, type ConfigLimite } from "./rateLimit";

const CONFIG: ConfigLimite = { capacidad: 3, fichasPorSegundo: 1 };

describe("AlmacenEnMemoria (cubo de fichas)", () => {
  it("admite la ráfaga completa y rechaza el siguiente", () => {
    const almacen = new AlmacenEnMemoria();
    for (let i = 0; i < 3; i++) {
      expect(almacen.consumir("ip", CONFIG, 0).permitido).toBe(true);
    }
    const rechazado = almacen.consumir("ip", CONFIG, 0);
    expect(rechazado.permitido).toBe(false);
    expect(rechazado.reintentarEnSegundos).toBe(1);
  });

  it("informa cuánto falta para la próxima ficha", () => {
    const almacen = new AlmacenEnMemoria();
    const lento: ConfigLimite = { capacidad: 1, fichasPorSegundo: 0.5 }; // una cada 2 s
    almacen.consumir("ip", lento, 0);
    expect(almacen.consumir("ip", lento, 0).reintentarEnSegundos).toBe(2);
    expect(almacen.consumir("ip", lento, 1000).reintentarEnSegundos).toBe(1);
  });

  it("recupera fichas con el tiempo", () => {
    const almacen = new AlmacenEnMemoria();
    for (let i = 0; i < 3; i++) almacen.consumir("ip", CONFIG, 0);
    expect(almacen.consumir("ip", CONFIG, 500).permitido).toBe(false); // 0,5 fichas
    expect(almacen.consumir("ip", CONFIG, 1000).permitido).toBe(true); // 1 ficha
    expect(almacen.consumir("ip", CONFIG, 1000).permitido).toBe(false);
  });

  it("no acumula más que la capacidad aunque pase mucho tiempo", () => {
    const almacen = new AlmacenEnMemoria();
    almacen.consumir("ip", CONFIG, 0);
    const resultados = Array.from({ length: 5 }, () => almacen.consumir("ip", CONFIG, 3_600_000));
    expect(resultados.filter((r) => r.permitido)).toHaveLength(3);
  });

  it("cada clave tiene su propio cubo", () => {
    const almacen = new AlmacenEnMemoria();
    for (let i = 0; i < 3; i++) almacen.consumir("a", CONFIG, 0);
    expect(almacen.consumir("a", CONFIG, 0).permitido).toBe(false);
    expect(almacen.consumir("b", CONFIG, 0).permitido).toBe(true);
  });

  it("un reloj que retrocede no regala fichas", () => {
    const almacen = new AlmacenEnMemoria();
    for (let i = 0; i < 3; i++) almacen.consumir("ip", CONFIG, 10_000);
    expect(almacen.consumir("ip", CONFIG, 5_000).permitido).toBe(false);
  });

  it("el Retry-After es de al menos 1 segundo", () => {
    const almacen = new AlmacenEnMemoria();
    const rapido: ConfigLimite = { capacidad: 1, fichasPorSegundo: 100 };
    almacen.consumir("ip", rapido, 0);
    expect(almacen.consumir("ip", rapido, 0).reintentarEnSegundos).toBe(1);
  });

  it("barre los cubos ya rellenos para no crecer sin límite", () => {
    const almacen = new AlmacenEnMemoria();
    for (let i = 0; i < 499; i++) almacen.consumir(`ip-${i}`, CONFIG, 0);
    expect(almacen.tamano).toBe(499);
    // Pasan 10 s: todos los cubos están completos de nuevo; la llamada 500 dispara el barrido.
    almacen.consumir("nueva", CONFIG, 10_000);
    expect(almacen.tamano).toBe(1);
  });

  it("reiniciar vacía el estado", () => {
    const almacen = new AlmacenEnMemoria();
    for (let i = 0; i < 3; i++) almacen.consumir("ip", CONFIG, 0);
    almacen.reiniciar();
    expect(almacen.consumir("ip", CONFIG, 0).permitido).toBe(true);
  });
});

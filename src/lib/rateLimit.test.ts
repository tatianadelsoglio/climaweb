import { describe, expect, it } from "vitest";
import { AlmacenEnMemoria, MAX_CLAVES, type ConfigLimite } from "./rateLimit";

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

  it("tras un retroceso del reloj, el relleno no cuenta segundos que no pasaron", () => {
    const almacen = new AlmacenEnMemoria();
    for (let i = 0; i < 3; i++) almacen.consumir("ip", CONFIG, 10_000); // cubo vacío en t = 10 s
    expect(almacen.consumir("ip", CONFIG, 5_000).permitido).toBe(false); // el reloj se atrasó 5 s
    // En t = 10 s no pasó nada desde la última vez que se vio ese instante: sigue vacío.
    expect(almacen.consumir("ip", CONFIG, 10_000).permitido).toBe(false);
    // Un segundo real después sí hay una ficha.
    expect(almacen.consumir("ip", CONFIG, 11_000).permitido).toBe(true);
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

  it("el barrido juzga cada cubo con su propia configuración, no con la de la ruta que lo dispara", () => {
    const almacen = new AlmacenEnMemoria();
    const clima: ConfigLimite = { capacidad: 30, fichasPorSegundo: 0.5 };
    const geocode: ConfigLimite = { capacidad: 60, fichasPorSegundo: 2 };

    // Una IP agota su cubo de clima (0 fichas) en t = 0.
    for (let i = 0; i < 30; i++) almacen.consumir("clima:ip", clima, 0);
    expect(almacen.consumir("clima:ip", clima, 0).permitido).toBe(false);

    // A los 30 s, pedidos de geocode (otra config) disparan el barrido: con SU ritmo de 2/s
    // el cubo de clima parecería lleno (0 + 30·2 = 60 ≥ 60), pero con el suyo (0,5/s) tiene 15 de 30.
    for (let i = 0; i < 499; i++) almacen.consumir(`geocode:ip-${i}`, geocode, 30_000);

    const siguiente = almacen.consumir("clima:ip", clima, 30_000);
    expect(siguiente.permitido).toBe(true); // 15 fichas: puede pedir...
    // ...pero no la ráfaga entera de 30: se quedó con 14 tras este pedido.
    let admitidos = 0;
    while (almacen.consumir("clima:ip", clima, 30_000).permitido) admitidos++;
    expect(admitidos).toBe(14);
  });

  it("el barrido también descarta, con su propia configuración, los cubos de otra ruta ya rellenos", () => {
    const almacen = new AlmacenEnMemoria();
    const lento: ConfigLimite = { capacidad: 2, fichasPorSegundo: 0.1 }; // 20 s para rellenar 2
    const rapido: ConfigLimite = { capacidad: 2, fichasPorSegundo: 10 };
    almacen.consumir("lento", lento, 0);
    almacen.consumir("rapido", rapido, 0);
    for (let i = 0; i < 497; i++) almacen.consumir(`relleno-${i}`, rapido, 0);
    expect(almacen.tamano).toBe(499);

    // A los 5 s el cubo rápido está lleno y el lento no (le falta 1 ficha: 0,5 de 1).
    almacen.consumir("disparador", rapido, 5_000);
    expect(almacen.tamano).toBe(2); // quedan «lento» y «disparador»
  });

  it("tope de claves: al pasar MAX_CLAVES se descartan las menos recientes", () => {
    const almacen = new AlmacenEnMemoria();
    const una: ConfigLimite = { capacidad: 1, fichasPorSegundo: 0.001 };
    for (let i = 0; i < MAX_CLAVES + 5; i++) almacen.consumir(`ip-${i}`, una, 0);

    expect(almacen.tamano).toBe(MAX_CLAVES);
    // Las 5 más viejas se descartaron: vuelven a tener su ficha. La última sigue gastada.
    expect(almacen.consumir("ip-0", una, 0).permitido).toBe(true);
    expect(almacen.consumir(`ip-${MAX_CLAVES + 4}`, una, 0).permitido).toBe(false);
    expect(almacen.tamano).toBeLessThanOrEqual(MAX_CLAVES);
  });

  it("un cubo usado de nuevo pasa a ser el más reciente y sobrevive al descarte", () => {
    const almacen = new AlmacenEnMemoria();
    const una: ConfigLimite = { capacidad: 1, fichasPorSegundo: 0.001 };
    almacen.consumir("vieja-pero-activa", una, 0);
    for (let i = 0; i < MAX_CLAVES - 1; i++) almacen.consumir(`ip-${i}`, una, 0);
    almacen.consumir("vieja-pero-activa", una, 0); // se reutiliza: ahora es la más reciente
    for (let i = 0; i < 5; i++) almacen.consumir(`extra-${i}`, una, 0); // fuerzan descartes
    expect(almacen.consumir("vieja-pero-activa", una, 0).permitido).toBe(false); // sigue gastada
  });

  it("reiniciar vacía el estado", () => {
    const almacen = new AlmacenEnMemoria();
    for (let i = 0; i < 3; i++) almacen.consumir("ip", CONFIG, 0);
    almacen.reiniciar();
    expect(almacen.consumir("ip", CONFIG, 0).permitido).toBe(true);
  });
});

/**
 * Acceso seguro a localStorage: puede lanzar o no existir (modo privado,
 * datos del sitio bloqueados, cuota llena), y la app tiene que seguir andando.
 */
export function leerAlmacenado(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

export function guardarAlmacenado(clave: string, valor: string): void {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento la preferencia vale solo para esta sesión.
  }
}

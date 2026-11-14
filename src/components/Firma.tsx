import Image from "next/image";

const URL_GITHUB = "https://github.com/tatianadelsoglio";

/**
 * Firma del autor: chip de vidrio oscuro (utilidad `vidrio-firma` en
 * globals.css) con el ícono de TAMADE y un link al GitHub.
 *
 * Contraste (WCAG 2.1 AA) medido sobre los 8 cielos, con el fondo al 60 %
 * compuesto sobre el peor punto del degradado: texto blanco ≥ 12,8:1 (AA pide
 * 4,5:1) e ícono a color ≥ 3,4:1 en su tono más oscuro (AA pide 3:1 para
 * gráficos). Con transparencia reducida o sin blur el fondo es sólido (#12172A):
 * texto 17,8:1 e ícono 4,8:1.
 *
 * Si el ícono a color dejara de contrastar (por ejemplo, con un cielo nuevo más
 * claro), se cambia a la versión blanca: reemplazar `src` por
 * "/brand/tamade-icon-white.png". Está en public/brand/ y tiene el mismo tamaño.
 */
const ICONO = "/brand/tamade-icon.png";

/**
 * Va al final de la página, en el flujo (no fija): abajo a la derecha en
 * desktop y centrada en mobile, sin tapar contenido.
 */
export default function Firma() {
  return (
    <footer className="flex justify-center px-xl pt-xl pb-xl lg:justify-end lg:px-gutter lg:pt-0 lg:pb-2xl">
      <a
        href={URL_GITHUB}
        target="_blank"
        rel="noopener noreferrer"
        className="vidrio-firma flex max-w-full items-center gap-md rounded-xl px-lg py-sm text-fg lg:rounded-pill lg:px-xl"
      >
        {/* Decorativo: el nombre de la marca ya está en el texto. */}
        <Image src={ICONO} alt="" width={32} height={28} className="h-7 w-8 shrink-0" />
        <span className="text-micro leading-snug font-medium lg:text-caption">
          <span>Diseñado y desarrollado por Tatiana Delsoglio</span>
          <span className="sr-only lg:not-sr-only"> · </span>
          <span className="block lg:inline">TAMADE Software / Development</span>
          <span className="sr-only"> (se abre en otra pestaña)</span>
        </span>
      </a>
    </footer>
  );
}

import Image from "next/image";

const URL_GITHUB = "https://github.com/tatianadelsoglio";
const ANIO = 2026;

/**
 * Ícono decorativo de TAMADE en blanco (public/brand/). Si hiciera falta la
 * versión a color, reemplazar por "/brand/tamade-icon.png": tiene el mismo
 * tamaño. En blanco y con opacidad reducida contrasta con los 8 cielos y no
 * le gana al texto.
 */
const ICONO = "/brand/tamade-icon-white.png";

/**
 * Pie de página estilo copyright, al final del contenido y alineado a su grilla
 * (no es fijo ni flotante, así que no tapa nada). Texto de 12 px en
 * --color-fg-muted: contraste ≥ 5,8:1 sobre los 8 cielos (AA pide 4,5:1). El
 * link al GitHub está solo en el nombre y se subraya en hover y en foco.
 */
export default function Firma() {
  return (
    <footer className="flex items-center gap-sm px-xl pt-xl pb-xl text-micro text-fg-muted lg:px-gutter lg:pb-2xl">
      {/* Decorativo: la marca ya está en el texto. */}
      <Image
        src={ICONO}
        alt=""
        width={16}
        height={14}
        className="h-3.5 w-4 shrink-0 opacity-70"
      />
      <p>
        © {ANIO} Atmósfera · Hecho por{" "}
        <a
          href={URL_GITHUB}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline focus-visible:underline"
        >
          Tatiana Delsoglio
          <span className="sr-only"> (se abre en otra pestaña)</span>
        </a>{" "}
        · TAMADE
      </p>
    </footer>
  );
}

import Image from "next/image";

const URL_GITHUB = "https://github.com/tatianadelsoglio";
const URL_OPENWEATHER = "https://openweathermap.org";
const URL_OPEN_METEO = "https://open-meteo.com";
const ANIO = 2026;

/**
 * Ícono decorativo de TAMADE en blanco (public/brand/). Si hiciera falta la
 * versión a color, reemplazar por "/brand/tamade-icon.png": tiene el mismo
 * tamaño. En blanco y con opacidad reducida contrasta con los 8 cielos y no
 * le gana al texto.
 */
const ICONO = "/brand/tamade-icon-white.png";

// Subrayado siempre visible (un link no puede distinguirse solo por color: el texto
// del pie y sus links comparten color) y pleno en hover y foco. Al 70 % el subrayado
// da ≥ 3,7:1 contra el fondo en los 8 cielos (al 40 % daba 2,2:1; WCAG 1.4.11 pide 3:1).
const CLASE_LINK =
  "underline decoration-fg-muted/70 underline-offset-2 hover:decoration-fg focus-visible:decoration-fg";

function LinkExterno({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={CLASE_LINK}>
      {children}
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  );
}

/**
 * Pie de página estilo copyright, centrado, al final del contenido (no es fijo
 * ni flotante, así que no tapa nada). Texto de 12 px en --color-fg-muted:
 * contraste ≥ 5,8:1 sobre los 8 cielos (AA pide 4,5:1), por eso la segunda línea
 * no se atenúa más. La segunda línea acredita a los proveedores de datos
 * (atribución requerida; Open-Meteo es CC BY 4.0).
 */
export default function Firma() {
  return (
    <footer className="flex flex-col items-center gap-3xs px-xl pt-xl pb-xl text-center text-micro text-fg-muted lg:pb-2xl">
      <p className="text-balance">
        © {ANIO} Atmósfera · Diseñado y desarrollado por{" "}
        <LinkExterno href={URL_GITHUB}>Tatiana Delsoglio</LinkExterno> ·{" "}
        <span className="inline-flex items-center gap-xs align-middle whitespace-nowrap">
          TAMADE
          {/* Decorativo: la marca ya está en el texto. */}
          <Image
            src={ICONO}
            alt=""
            width={361}
            height={316}
            className="h-auto w-5 shrink-0 opacity-70"
          />
        </span>
      </p>
      <p>
        Datos: <LinkExterno href={URL_OPENWEATHER}>OpenWeather</LinkExterno> ·{" "}
        <LinkExterno href={URL_OPEN_METEO}>Open-Meteo</LinkExterno>
      </p>
    </footer>
  );
}

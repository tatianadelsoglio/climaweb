import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
  display: "swap",
  // Eje de tamaño óptico: globals.css lo fija en 96, como en el diseño.
  axes: ["opsz"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Atmósfera",
    template: "%s · Atmósfera",
  },
  applicationName: "Atmósfera",
  description:
    "Atmósfera: el clima actual y el pronóstico de 5 días de cualquier ciudad, con un cielo que cambia según la hora local.",
};

export const viewport: Viewport = {
  // --color-sky-top del cielo inicial (clear-day); useCieloDocumento lo
  // actualiza cuando cambia el cielo.
  themeColor: "#173F86",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${bricolageGrotesque.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans text-fg">{children}</body>
    </html>
  );
}

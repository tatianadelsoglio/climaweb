import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// En Windows, si la terminal abre la carpeta con la letra de unidad en mayúscula ("C:\"),
// Vitest 5 resuelve dos copias del paquete y falla con «Cannot read properties of
// undefined (reading 'config')». Se normaliza la letra de unidad a minúscula.
const raiz = fileURLToPath(new URL(".", import.meta.url)).replace(/^[A-Z]:/, (u) => u.toLowerCase());

export default defineConfig({
  root: raiz,
  resolve: {
    // Mismo alias que tsconfig.json: "@/..." → src/...
    alias: { "@": `${raiz}src` },
  },
  test: {
    // Entorno Node por defecto; los tests de hooks y componentes piden jsdom con
    // el comentario `// @vitest-environment jsdom` al principio del archivo.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    unstubGlobals: true,
  },
});

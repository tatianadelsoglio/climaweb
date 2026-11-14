import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// En Windows, si la terminal abre la carpeta con la letra de unidad en mayúscula ("C:\"),
// Vitest 5 resuelve dos copias del paquete y falla con «Cannot read properties of
// undefined (reading 'config')». Se normaliza la letra de unidad a minúscula.
const raiz = fileURLToPath(new URL(".", import.meta.url))
  .replaceAll("\\", "/")
  .replace(/^[A-Z]:/, (unidad) => unidad.toLowerCase());

export default defineConfig({
  root: raiz,
  resolve: {
    // Mismo alias que tsconfig.json ("@/..." → src/...). Se resuelve contra la raíz
    // (/src/...) y no con una ruta absoluta de disco: con una ruta absoluta, Vite trataba
    // los módulos importados por alias como otros distintos y React se cargaba dos
    // veces (error «Cannot read properties of null (reading 'useState')» en los hooks).
    alias: [{ find: /^@\/(.*)$/, replacement: "/src/$1" }],
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

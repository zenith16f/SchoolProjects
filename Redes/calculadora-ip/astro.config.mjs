import { defineConfig } from "astro/config";

// Sitio 100% estático: los cálculos se ejecutan en el navegador.
// No hay backend ni envío de datos a ningún servidor.
export default defineConfig({
  output: "static",
  compressHTML: true,
});

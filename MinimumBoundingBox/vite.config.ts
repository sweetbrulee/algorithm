import { defineConfig } from "vite";

export default defineConfig({
  base: "/algorithm/mbb/",
  server: {
    open: true,
  },
  build: {
    outDir: "../dist/mbb",
  },
});

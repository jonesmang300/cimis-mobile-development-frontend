import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext",
    outDir: "dist-web",
  },
  define: {
    "import.meta.env.VITE_TARGET": JSON.stringify("web"),
  },
  resolve: {
    alias: {
      // Ensure web entry uses web folder first if similarly named modules exist
      "@web": "/src/web",
    },
  },
});

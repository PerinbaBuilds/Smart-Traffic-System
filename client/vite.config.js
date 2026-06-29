import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// "demo" mode produces the static, backend-free build published to GitHub
// Pages (served from a /Smart-Traffic-System/ subpath). The default build
// is meant to be served from the root of its own origin, e.g. by the
// Node server in single-process mode or by the nginx container.
export default defineConfig(({ mode }) => ({
  base: mode === "demo" ? "/Smart-Traffic-System/" : "/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/socket.io": { target: "http://localhost:4000", ws: true },
    },
  },
  build: {
    outDir: "dist",
  },
}));

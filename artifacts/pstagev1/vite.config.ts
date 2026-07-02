import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// PORT and BASE_PATH are required in dev (the dev server needs them) but
// optional during `vite build` (CI / Render build step).
const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5000;

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // runtimeErrorOverlay is dev-only — skip in production builds
    ...(process.env.NODE_ENV !== "production" ? [runtimeErrorOverlay()] : []),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Raise the chunk-size warning threshold — individual vendor chunks are expected
    chunkSizeWarningLimit: 600,
    rollupOptions: {},
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    // Allow all hosts — needed for Replit preview proxy and ngrok tunnels
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      // REST API
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      // Socket.io WebSocket — must be proxied separately from HTTP
      // Without this, ngrok/Replit proxy never forwards the WS upgrade
      "/ws": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true, // forward WebSocket upgrade frames
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});

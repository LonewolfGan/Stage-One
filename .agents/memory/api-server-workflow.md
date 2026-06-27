---
name: API Server workflow quirks
description: Port and startup behavior for the Express API server workflow on Replit
---

## Rule
Use **port 8000** (not 8080) for the API server workflow. Port 8080 causes Replit's workflow port-detection to mark the workflow as FAILED even when the server is actually running.

**Why:** Replit's workflow runner monitors specific ports for HTTP readiness. Port 8080 has unreliable detection in this environment; port 8000 is reliably detected.

## Rule  
The API server workflow command must skip the build step at start time. Use:
```
cd artifacts/api-server && PORT=8000 node --enable-source-maps ./dist/index.mjs
```
NOT:
```
PORT=8000 pnpm --filter @workspace/api-server run dev
```

**Why:** The `dev` script runs `pnpm run build` (esbuild, ~2s) before starting. This causes the Replit workflow restart tool to time out waiting for the port. Pre-build with `pnpm --filter @workspace/api-server run build` in bash, then start the pre-built binary directly in the workflow.

**How to apply:** Whenever the API server code changes, run the build in bash first, then restart the workflow. The workflow itself just runs the already-compiled binary.

## Vite proxy
Frontend (`artifacts/pstagev1/vite.config.ts`) must proxy `/api` to the backend:
```ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
      secure: false,
    },
  },
}
```

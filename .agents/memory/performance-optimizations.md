---
name: Performance optimizations
description: All perf fixes applied — lazy loading, AnimatePresence, QueryClient defaults, WebSocket proxy, compression, CORS.
---

## Changes applied (July 2026)

### Root causes fixed
1. **Blank pages** — AnimatePresence was mode="wait" (unmounted old page before new one mounted). Changed to mode="sync". Added Suspense + PageErrorBoundary inside the animated wrapper.
2. **Slow initial load** — All 24 pages were eagerly imported. Replaced with React.lazy() + Suspense. Each page is now a separate JS chunk.
3. **Waterfall re-fetches** — QueryClient had no defaults (staleTime: 0, refetchOnWindowFocus: true). Now: staleTime 30s, gcTime 5min, retry 1, refetchOnWindowFocus false.
4. **ngrok / external device crashes** — Two issues: (a) Socket.io /ws path was NOT proxied in vite.config.ts — added `"/ws": { target, ws: true }`. (b) CORS was `origin: ["*"]` with `credentials: true` — invalid combination. Fixed to reflect origin in dev, validate FRONTEND_URL list in production only.
5. **No compression** — Added `compression` package to api-server. Install: `pnpm --filter @workspace/api-server add compression`.
6. **No code splitting** — Added Vite manualChunks: vendor-react, vendor-state, vendor-motion, vendor-map, vendor-charts, vendor-stripe, vendor-radix, vendor-misc.

### Files changed
- `artifacts/pstagev1/src/App.tsx` — lazy imports, Suspense, PageErrorBoundary, AnimatePresence mode="sync", QueryClient defaults
- `artifacts/pstagev1/src/components/PageErrorBoundary.tsx` — new ErrorBoundary class component
- `artifacts/pstagev1/vite.config.ts` — /ws WebSocket proxy, manualChunks build config
- `artifacts/pstagev1/src/index.css` — added @keyframes spin for PageShell spinner
- `artifacts/api-server/src/app.ts` — compression(), CORS origin function (reflect in dev, allowlist in prod)

**Why:** mode="wait" + no lazy loading = guaranteed blank page on every navigation. /ws not proxied = socket.io WS upgrade silently dropped through ngrok. credentials+wildcard CORS = browser rejects all credentialed requests.

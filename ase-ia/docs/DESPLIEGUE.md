# Despliegue · ASE-IA

Dos componentes: la **web** (estática, Firebase Hosting) y la **API** (servicio
Node, Cloud Run). Las claves viven solo en la API.

## 1. Web (Firebase Hosting)

```bash
cd ase-ia
# Variables públicas en build
export NEXT_PUBLIC_API_URL=https://api.tu-colegio.cl
export NEXT_PUBLIC_FIREBASE_API_KEY=...
export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
export NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

pnpm --filter @ase-ia/shared build
pnpm --filter @ase-ia/web build      # genera apps/web/out (export estático)
firebase deploy --only hosting
```

El widget embebible (`apps/widget`) se publica junto a la web:
```bash
pnpm --filter @ase-ia/widget build   # dist/: loader.js, embed.html
# sube dist/ al hosting (p. ej. carpeta /ase-ia)
```

## 2. API (Cloud Run)

```bash
cd ase-ia
gcloud run deploy ase-ia-api \
  --source . \
  --region southamerica-west1 \
  --set-env-vars NODE_ENV=production,AI_PROVIDER=gemini,WORKSPACE_PROVIDER=mock \
  --set-secrets GEMINI_API_KEY=ASEIA_GEMINI:latest,\
FIREBASE_PROJECT_ID=ASEIA_FB_PROJECT:latest,\
FIREBASE_CLIENT_EMAIL=ASEIA_FB_EMAIL:latest,\
FIREBASE_PRIVATE_KEY=ASEIA_FB_KEY:latest \
  --allow-unauthenticated
```

> El `Dockerfile` está en `apps/api/Dockerfile` (build desde la raíz del
> monorepo). Cloud Run inyecta `PORT`; la API escucha en `API_PORT` (8080).
> Recuerda incluir el dominio del hosting en `ALLOWED_ORIGINS`.

## 3. Firestore

```bash
firebase deploy --only firestore:rules
```
Siembra la base de conocimiento inicial cargando documentos desde
`/admin/documents` o con `POST /api/documents`.

## 4. Observabilidad

- `GET /api/health` — estado, proveedor de IA, auth configurada.
- `GET /api/metrics` — uptime, total de requests, resultados de chat.
- Logs por petición en formato JSON (parseables por Cloud Logging).
- Rate limiting: 120 req/min general y 20 req/min en `/api/chat` por IP.

## 5. Checklist de seguridad antes de producción

- [ ] `AI_PROVIDER` real con su clave en Secret Manager (no en el repo).
- [ ] Firebase Auth configurado (sin fallback de cabeceras `x-ase-*`).
- [ ] `ALLOWED_ORIGINS` con los dominios reales del colegio.
- [ ] Reglas de Firestore desplegadas.
- [ ] Roles asignados a los usuarios (panel `/admin/roles`).

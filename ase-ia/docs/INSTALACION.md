# Manual de Instalación · ASE-IA

## Requisitos
- Node.js ≥ 20
- pnpm ≥ 10 (`npm install -g pnpm`)
- (Opcional) Cuenta de Firebase y claves de Gemini/OpenAI/Anthropic

## 1. Clonar e instalar
```bash
git clone <repo>
cd tutorsocratico/ase-ia
pnpm install
```

## 2. Variables de entorno
```bash
cp .env.example .env
```
Con `AI_PROVIDER=mock` el sistema funciona **sin claves** (ideal para probar).
Para respuestas reales, define `AI_PROVIDER=gemini|openai|anthropic` y la clave
correspondiente.

## 3. Levantar en desarrollo
```bash
pnpm dev
# API  → http://localhost:4000/api/health
# Web  → http://localhost:3000
```

O por separado:
```bash
pnpm dev:api
pnpm dev:web
```

## 4. Probar la API
```bash
curl http://localhost:4000/api/health
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Cuándo termina el semestre?"}'
```

## 5. Probar el widget embebible
Sirve `apps/widget/src/` con cualquier servidor estático y abre una página con:
```html
<script src="loader.js" data-api="http://localhost:4000"></script>
```

## 6. Build de producción
```bash
pnpm build
```

## 7. Autenticación con Google (opcional en dev)

Sin configurar Firebase, la API usa un **fallback de desarrollo**: confía en
cabeceras `x-ase-role`, `x-ase-uid`, etc. (solo local). Para activar el login
real con Google:

1. Crea un proyecto en Firebase y habilita **Authentication → Google**.
2. Completa en `.env`:
   - API (Admin): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
   - Web (cliente): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
3. Asigna roles a los usuarios (custom claims):
   ```bash
   pnpm --filter @ase-ia/api set-role -- <uid> teacher jjp
   ```
   El usuario debe cerrar e iniciar sesión para recibir el nuevo rol.

Probar la sesión:
```bash
# Modo dev (sin Firebase): se simula el rol con una cabecera
curl http://localhost:4000/api/auth/session -H "x-ase-role: teacher"
```

## 8. Despliegue (resumen, detalle en M8)
- Web/widget → Firebase Hosting (`firebase deploy --only hosting`).
- API → Cloud Run o Cloud Functions (variables de entorno con las claves).

# Manual para Desarrolladores · ASE-IA

## Filosofía
- **Modular y desacoplado.** La lógica de IA no conoce el proveedor; la UI no
  conoce la implementación de Workspace.
- **Grounding primero.** Cualquier cambio que permita responder sin fuentes es
  un bug de seguridad.
- **Contratos compartidos.** Todo lo que cruza la frontera cliente/servidor vive
  en `packages/shared`.

## Mapa del código

```
apps/api/src/
  config/            Lee variables de entorno
  routes/            Define endpoints (/health, /chat, /workspace, /audit)
  controllers/       chatController: orquesta el flujo
  services/
    ai/              AIProvider (interfaz) + adapters + factory
    auth/            firebaseAdmin: verificación de token + custom claims
    rag/             retriever (palabras clave → vectorial en M5)
    guardrails/      scope, system prompt por rol, verificación de anclaje
    workspace/       interfaces + MockAdapter (GoogleApiAdapter en M6)
    audit/           registro de auditoría
  middleware/        authenticate + requireRole, errores
  scripts/           setRole (asignar roles vía custom claims)
apps/web/            Next.js (App Router) + Tailwind
apps/widget/         loader.js + embed.html
packages/shared/     types, contracts, constants
```

## Cómo agregar un proveedor de IA
1. Crea `apps/api/src/services/ai/MiProvider.ts` implementando `AIProvider`.
2. Regístralo en `AIProviderFactory.ts`.
3. Añade su clave a `.env.example` y `config/index.ts`.
La interfaz `generate(input)` no cambia: recibe `system`, `prompt` y `context`
(fuentes recuperadas) y devuelve `{ text, provider }`.

## Autenticación y roles (M1)
- `authenticate` (middleware) verifica el ID token de Firebase y pone el usuario
  en `req.user` (`uid`, `email`, `role`, `schoolId`). Sin Firebase configurado y
  en desarrollo, usa cabeceras `x-ase-*` (inseguro, solo local).
- `requireRole("teacher", ...)` restringe rutas por rol; va después de
  `authenticate`.
- El rol vive en los **custom claims** del token; se asigna con el script
  `set-role`. Nunca confíes en un rol enviado por el cliente: solo el del token.

## Grounding e historial (M3)
- El prompt de sistema exige citar `[n]` por fuente. Las fuentes se entregan
  numeradas al proveedor.
- `verifyGrounding(reply, sourceCount)` valida que la respuesta cite al menos
  una fuente dentro de rango; si no, el controlador devuelve `NO_INFO_MESSAGE`.
  Esto evita "respuestas inventadas" aunque el modelo se desvíe.
- El historial llega en `ChatRequest.history`; se sanea en el controlador
  (`sanitizeHistory`) antes de pasarlo al proveedor. No confíes en su contenido
  para autorizar nada: es solo contexto conversacional.
- Para añadir un proveedor nuevo, recuerda incluir `input.history` en su formato
  de mensajes y numerar `input.context` como `[n]`.

## Base de conocimiento (M4)
- Subida: `POST /api/documents` (multipart `file` o campo `texto`) — solo
  docentes. La extracción (`services/documents/extract.ts`) soporta TXT, MD, PDF
  y DOCX; el troceado vive en `chunk.ts`.
- Almacenamiento: `DocumentStore` (interfaz) con `InMemoryDocumentStore` (dev,
  sembrado en `services/documents/index.ts`) y `FirestoreDocumentStore`. El
  retriever lee `getChunks(schoolId, role)`, así que respeta visibilidad por rol.
- Documentos base: edita el array `SEED` en `services/documents/index.ts`. En
  producción se cargan vía la API / página `/admin/documents`.
- Embeddings (M5): se calculan en la ingesta (`services/rag/embeddings.ts`,
  best-effort) y se guardan en el chunk. El retriever usa coseno y, si no hay
  embeddings, cae a léxico — sin cambiar la interfaz del `DocumentStore`.

## Convenciones
- TypeScript estricto. Tipos compartidos siempre desde `@ase-ia/shared`.
- Comentarios en español, alineados al dominio escolar.
- Los `console.log` de auditoría se migran a Firestore en M8.

## Scripts
```bash
pnpm dev         # web + api en paralelo
pnpm typecheck   # tsc --noEmit en todos los paquetes
pnpm build       # build de todos los paquetes
```

## Seguridad al contribuir
- Nunca subas `.env` ni claves.
- Las claves de IA y tokens OAuth solo se leen en `apps/api`.
- Toda nueva ruta que devuelva datos institucionales debe pasar por
  autenticación y filtro por rol.

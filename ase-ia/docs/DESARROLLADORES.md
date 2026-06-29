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
    rag/             retriever (palabras clave → vectorial en M5)
    guardrails/      scope, system prompt por rol, verificación de anclaje
    workspace/       interfaces + MockAdapter (GoogleApiAdapter en M6)
    audit/           registro de auditoría
  middleware/        auth (stub→Firebase en M1), errores
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

## Cómo agregar fuentes a la base de conocimiento (M0)
Edita `apps/api/src/services/rag/retriever.ts` (array `SEED`). En M4/M5 esto se
reemplaza por documentos reales indexados en Firestore + embeddings.

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

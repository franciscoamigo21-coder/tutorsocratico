# Roadmap · ASE-IA

Cada módulo se entrega **funcional y probado** antes de pasar al siguiente.

## ✅ M0 — Scaffolding (actual)
- Monorepo pnpm (apps/web, apps/widget, apps/api, packages/shared).
- Abstracción de IA con 4 adapters (Gemini, OpenAI, Anthropic, Mock).
- Orquestador de chat con guardrails y auditoría (base de conocimiento semilla).
- Widget embebible (loader.js + embed.html).
- Web Next.js con chat conectado a la API.
- Documentación, CI y reglas de Firestore base.

## ✅ M1 — Autenticación y roles
- Google OAuth vía Firebase Auth (cliente web) + verificación de ID token con
  Firebase Admin (API).
- Custom claims (`role`, `schoolId`); middleware `authenticate` reemplaza al
  stub; guarda `requireRole(...)` aplicada (p. ej. `/audit` solo docentes).
- Fallback de desarrollo (cabeceras `x-ase-*`) cuando Firebase no está
  configurado, para probar roles sin credenciales.
- Script `pnpm --filter @ase-ia/api set-role -- <uid> <role> [schoolId]`.
- `useAuth` (web): login/logout con Google y token adjuntado a la API.

## ✅ M2 — UI y widget
- Avatar ASE-IA (SVG), botón flotante tipo chatbot, panel responsive (tarjeta
  en escritorio, pantalla completa en móvil), indicador de "escribiendo…",
  citas como chips.
- Landing institucional con tarjetas de capacidades.
- Widget empaquetado con esbuild (`loader.js` minificado + `embed.html` +
  `demo.html`); incrustación de una línea.
- Retriever: normalización de acentos/puntuación (mejor recuperación).
- Verificado visualmente con Playwright (web y widget, escritorio y móvil).

## M3 — Orquestador IA + grounding (consolidar)
- Verificador de anclaje más estricto; citas inline.
- Manejo de conversación con historial.

## M4 — Carga de documentos
- Subida de PDF/Word/Google Docs; extracción de texto; estado de indexado.
- Colección `documents` + visibilidad por rol.

## M5 — RAG
- Embeddings vía `AIProvider.embed`; vector store (Firestore/Vertex/pgvector).
- Retriever vectorial reemplaza el de palabras clave sin cambiar la interfaz.

## M6 — Google Workspace (real)
- `GoogleApiAdapter` para Classroom, Drive, Calendar, Gmail, Docs, Sheets, Slides.
- Tareas, fechas y materiales reales.

## M7 — Panel admin
- Gestión de documentos, roles y visibilidad.
- Visor de `audit_logs`.

## M8 — Observabilidad y despliegue
- Métricas, alertas, rate limiting productivo.
- Deploy en Firebase Hosting + Cloud Run/Functions.

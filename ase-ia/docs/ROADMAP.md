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

## ✅ M3 — Orquestador IA + grounding (consolidado)
- Historial conversacional: el cliente envía los últimos turnos; la API los
  sanea (roles válidos, longitud acotada, máx. 6) y los pasa al proveedor.
- Citas inline: el modelo cita `[n]` por fuente; la respuesta solo devuelve las
  fuentes efectivamente citadas (con su `index`).
- Verificador de anclaje ESTRICTO (`verifyGrounding`): una respuesta con
  contenido pero sin un marcador `[n]` válido se descarta y se entrega el
  mensaje canónico de "sin información". Campo `confidence` en la respuesta.
- Historial soportado en los 4 proveedores (Gemini usa role `model`).

## ✅ M4 — Carga de documentos
- Subida de archivos (TXT, MD, PDF, DOCX) o texto pegado; extracción de texto
  (pdf-parse, mammoth) y troceado (chunking) por párrafos.
- `DocumentStore` con dos implementaciones: `InMemory` (dev, sembrado) y
  `Firestore` (`schools/{id}/documents` + `chunks`), elegidas según config.
- El retriever consume los chunks del almacén (ya no una base en memoria fija),
  filtrados por establecimiento y rol.
- Endpoints: `GET /documents`, `POST /documents` (docente), `DELETE` (docente).
  Página web `/admin/documents` para cargar/listar/eliminar.
- Google Docs reales se integran en M6 (por ahora: exportar a PDF/DOCX o pegar).
- Verificado: TXT, texto pegado, PDF (real, vía Chromium) y DOCX (real, vía
  jszip) extraen correctamente; visibilidad por rol y borrado probados.

## ✅ M5 — RAG
- `AIProvider.embed` implementado: Mock (embedding determinista offline),
  Gemini (text-embedding-004), OpenAI (text-embedding-3-small). Anthropic no
  ofrece embeddings → cae a léxico.
- Embeddings calculados por chunk en la ingesta (best-effort) y guardados en el
  chunk (memoria y Firestore).
- Retriever VECTORIAL por similitud coseno con umbral; respaldo LÉXICO
  automático si no hay embeddings o el proveedor no los soporta. La interfaz
  `retrieve()` no cambió.
- Verificado: ranking vectorial correcto (la consulta de calendario rankea el
  Calendario por encima del reglamento).

## ✅ M6 — Google Workspace (integrado al chat)
- Servicios Classroom / Calendar / Drive con interfaces + `MockAdapter` (activo)
  y scaffolds `GoogleApiAdapter` (token OAuth), seleccionables por
  `WORKSPACE_PROVIDER`.
- `gatherWorkspaceCitations`: detecta intención (tareas, fechas/evaluaciones,
  material) y aporta fuentes citables; el orquestador las combina con los
  documentos para un grounding uniforme.
- Role-gating (p. ej. Classroom solo estudiante/docente). Endpoints
  `/workspace/{assignments,calendar,drive}`.
- Pendiente para producción: plomería del access token OAuth (con scopes) desde
  el front a los `GoogleApiAdapter`; ampliar a Gmail/Docs/Sheets/Slides.

## ✅ M7 — Panel admin
- Dashboard `/admin` con accesos a Documentos, Roles y Auditoría.
- Documentos: cargar/listar/eliminar (M4).
- Roles: asignar perfil por correo (`POST /admin/roles`, custom claims). En dev
  sin Firebase devuelve 501 con explicación; en prod usa Firebase Admin.
- Auditoría: `GET /admin/logs` + tabla web con resultado por consulta.
- Bug corregido (gracias a la auditoría): el embedding mock generaba falsos
  positivos; se subió la dimensión a 256 y el umbral de coseno a 0.2, así
  consultas ajenas ("capital de Francia") devuelven "sin información".

## ✅ M8 — Observabilidad y despliegue
- Hardening: `helmet` (cabeceras), `express-rate-limit` (120/min general,
  20/min en `/api/chat`), `trust proxy`. En producción se desactiva el fallback
  de autenticación por cabeceras (exige Firebase real).
- Observabilidad: logger de peticiones en JSON, `GET /api/metrics` (uptime,
  requests por clase de estado, resultados de chat).
- Despliegue: `Dockerfile` de la API (Cloud Run), export estático de la web
  (`output: export` → `out/`), `firebase.json` ajustado y `docs/DESPLIEGUE.md`.
- Verificado: build de producción de la API corre desde `dist`; export estático
  genera las 8 rutas; métricas y rate-limit headers correctos.

---

**v1 completo (M0–M8).** Próximos pasos sugeridos: plomería de tokens OAuth para
Workspace real (Gmail/Docs/Sheets/Slides), rol "admin" dedicado, vector store
gestionado (Vertex/pgvector) y tests automatizados en CI.

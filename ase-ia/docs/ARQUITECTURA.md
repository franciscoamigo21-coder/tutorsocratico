# Arquitectura del Sistema · ASE-IA

## 1. Principio rector

> ASE-IA **nunca inventa**. El modelo de lenguaje **no es la fuente de
> verdad**: es solo el redactor. La verdad vive en la base de conocimiento
> institucional. El LLM reformula lo que el sistema *recupera* (RAG con
> grounding obligatorio).

## 2. Componentes

| Capa | Tecnología | Rol |
|------|-----------|-----|
| Web App | Next.js 14 + React + Tailwind | UI, panel admin, host del chat |
| Widget | JS vanilla (iframe + loader) | Incrustar en sitios institucionales |
| API | Node + Express (TypeScript) | Orquestación IA, RAG, Workspace, seguridad |
| Shared | TypeScript | Tipos y contratos compartidos |
| Datos | Firebase Firestore | Usuarios, documentos, logs, conversaciones |
| Auth | Firebase Auth + Google OAuth | Identidad y roles (custom claims) |
| Hosting | Firebase Hosting | Despliegue de la web/widget |

### ¿Por qué Express separado y no solo Next API routes?

Las integraciones de Workspace y el RAG son trabajo de servidor con secretos
(tokens OAuth, claves de IA). Aislarlo en un servicio da: (a) **seguridad** —el
navegador nunca toca claves; (b) **escalabilidad** independiente; (c)
**reutilización** por el widget y la web. Es el patrón ya validado con el
Cloudflare Worker del Tutor Socrático, ahora formalizado.

## 3. Abstracción de IA (Strategy + Adapter)

```
AIProvider (interfaz)
  ├─ generate(input): { text, provider }
  └─ embed(text): number[]              // RAG (M5)

Implementaciones: Gemini · OpenAI · Anthropic · Mock
Selección: AI_PROVIDER  →  AIProviderFactory
```

El orquestador depende **solo** de la interfaz. Cambiar de proveedor = cambiar
una variable de entorno. Si el proveedor elegido no tiene clave, cae a `mock`.

## 4. Flujo de una consulta (grounding)

```
Usuario → API /chat
  → Auth + Rol
  → Guardrail: ¿ámbito escolar?      (no → fuera de alcance)
  → Retriever: buscar fuentes
  → ¿Hay fuentes?                    (no → "no tengo info" + log)
  → AIProvider redacta SOLO con esas fuentes
  → Verificador: ¿respuesta anclada?
  → Respuesta + citas
  → Audit log
```

Ver [`diagramas/flujo.md`](diagramas/flujo.md).

## 5. Roles y permisos

`Google OAuth → Firebase Auth → custom claims (role, schoolId)`. Validación en
dos capas: **middleware Express** + **Firestore Security Rules**.

| Capacidad | Estudiante | Docente | Apoderado |
|---|:--:|:--:|:--:|
| Buscar info/tareas/docs/reglamentos | ✅ | ✅ | ✅ |
| Redactar correos/comunicaciones | ✅ | ✅ | ✅ |
| Compartir material / comunicados | — | ✅ | — |
| Protocolos institucionales | parcial | ✅ | ✅ |

## 6. Modelo de datos (Firestore)

```
schools/{schoolId}
  users/{uid}          role, email, schoolId
  documents/{docId}    titulo, tipo, url, visibleParaRoles[], status
  chunks/{chunkId}     docId, texto, embedding[]   (RAG)
  conversations/{cid}  uid, mensajes[], fuentesCitadas[]
  audit_logs/{logId}   uid, rol, consulta, resultado, proveedorIA, ts
```

`schoolId` desde el día 1 → multi-establecimiento sin reescrituras.

## 7. Google Workspace (simulado → real)

Cada servicio (Classroom, Drive, Calendar, Gmail, Docs, Sheets, Slides) tiene
una interfaz estable y dos implementaciones: `MockAdapter` (ahora) y
`GoogleApiAdapter` (M6). La UI no cambia al conectar la API real.

## 8. Seguridad

- Claves/tokens **solo** en el servidor.
- Grounding obligatorio + mensaje canónico cuando no hay info.
- Filtro de ámbito escolar.
- `audit_logs` por consulta.
- Rate limiting y manejo central de errores.
- Firestore Security Rules por rol y `schoolId`.

## 9. Decisiones registradas (ADR resumido)

| # | Decisión | Motivo |
|---|----------|--------|
| 1 | Monorepo pnpm | Compartir tipos/contratos; un solo flujo de CI |
| 2 | Express separado de Next | Secretos y trabajo pesado fuera del navegador |
| 3 | Abstracción de IA | Cambiar proveedor sin tocar lógica |
| 4 | Gemini primero | Coherencia con Google Workspace del colegio |
| 5 | `schoolId` desde v0 | Escalar a otros establecimientos |
| 6 | Grounding obligatorio | "Nunca inventar" es requisito, no opción |

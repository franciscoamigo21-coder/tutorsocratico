# ASE-IA · Asistente Escolar de Inteligencia Artificial

> Colegio Presidente José Joaquín Prieto · **SIP Red de Colegios** · Chile

ASE-IA ayuda a **estudiantes, docentes y apoderados** a gestionar la
información institucional (tareas, documentos, reglamentos, fechas,
comunicaciones) mediante lenguaje natural.

**No es un chatbot genérico.** ASE-IA responde **únicamente** con información
autorizada por el establecimiento y **nunca inventa**: si no hay fuente, lo
declara.

---

## Estado del proyecto

| Módulo | Descripción | Estado |
|--------|-------------|:------:|
| **M0** | Scaffolding monorepo, abstracción de IA, guardrails, widget, docs | ✅ |
| **M1** | Auth Google (Firebase) + roles (custom claims) + guardas | ✅ |
| **M2** | UI Chat + avatar + botón flotante + widget empaquetado | ✅ |
| **M3** | Orquestador IA: historial + citas inline + verificador estricto | ✅ |
| **M4** | Carga de documentos (TXT/MD/PDF/DOCX) + base de conocimiento | ✅ |
| **M5** | RAG: embeddings por chunk + búsqueda vectorial (coseno) | ✅ |
| **M6** | Google Workspace integrado al chat (Classroom/Calendar/Drive) | ✅ |
| **M7** | Panel admin: documentos + roles + auditoría | ✅ |
| **M8** | Observabilidad (métricas/logs) + hardening + deploy | ✅ |

**v1 completo (M0–M8).** Detalle en [`docs/ROADMAP.md`](docs/ROADMAP.md) ·
despliegue en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

## Estructura

```
ase-ia/
├── apps/
│   ├── web/      Next.js + Tailwind (UI + panel admin)
│   ├── widget/   Widget embebible (iframe + loader.js)
│   └── api/      Express (orquestador IA, RAG, Workspace, seguridad)
├── packages/
│   └── shared/   Tipos y contratos compartidos
└── docs/         Arquitectura, manuales, roadmap, diagramas
```

## Inicio rápido

```bash
cd ase-ia
pnpm install
cp .env.example .env        # AI_PROVIDER=local funciona sin claves
pnpm dev                    # levanta API (:4000) y web (:3000)
```

> **Conector de IA `local`** (por defecto): redacta respuestas naturales de
> forma extractiva desde las fuentes, sin clave ni costo y sin inventar. Para
> respuestas generativas más ricas, cambia `AI_PROVIDER` a `gemini`, `openai` o
> `anthropic` con su clave — la arquitectura desacoplada no requiere otro cambio.

Probar la API sin la web:

```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Qué dice el reglamento sobre atrasos?"}'
```

## Documentación

- [Arquitectura del sistema](docs/ARQUITECTURA.md)
- [Manual de instalación](docs/INSTALACION.md)
- [Manual para desarrolladores](docs/DESARROLLADORES.md)
- [Roadmap](docs/ROADMAP.md)
- [Diagramas](docs/diagramas/)

## Principios de seguridad

1. Nunca entregar información inventada (grounding obligatorio).
2. Advertir cuando no existe información autorizada.
3. No responder fuera del ámbito escolar.
4. Registrar logs de auditoría por consulta.
5. Permisos por rol (estudiante / docente / apoderado).
6. Las claves de IA viven **solo** en el servidor, nunca en el navegador.

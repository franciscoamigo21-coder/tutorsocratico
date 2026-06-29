# Diagrama de Carpetas

```
ase-ia/
├── apps/
│   ├── web/                      Next.js (UI + panel admin)
│   │   ├── app/                  Rutas App Router (layout, page)
│   │   ├── components/           Chat, Avatar, Sidebar…
│   │   ├── hooks/                useChat, useAuth, useRole
│   │   └── lib/                  Cliente API, Firebase client
│   ├── widget/                   Embebible
│   │   └── src/                  loader.js, embed.html
│   └── api/                      Express (orquestador)
│       └── src/
│           ├── config/
│           ├── routes/
│           ├── controllers/
│           ├── services/
│           │   ├── ai/           AIProvider + adapters + factory
│           │   ├── rag/          retriever
│           │   ├── workspace/    Classroom, Calendar… (mock)
│           │   ├── guardrails/   scope, prompts, anclaje
│           │   └── audit/        logs
│           ├── middleware/       auth, errores
│           └── types/
├── packages/
│   └── shared/                   types, contracts, constants
├── docs/                         arquitectura, manuales, roadmap, diagramas
├── firebase.json
├── firestore.rules
└── .github/workflows/ci.yml
```

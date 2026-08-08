# 🔌 Cómo conectar ASE-IA a una API de IA

ASE-IA funciona en **dos modos**:

| Modo | Qué hace | Requiere clave |
|------|----------|:---:|
| **Local** (por defecto) | Redacta respuestas extractivas desde los documentos del colegio. Funciona ya, gratis, sin inventar. | ❌ |
| **Online** | Una IA real (Claude/Gemini/OpenAI) redacta respuestas más naturales **usando solo las fuentes** que ASE-IA recupera. | ✅ |

La clave **nunca** puede ir en la página (es pública). Por eso se usa un pequeño
**proxy** que la guarda en secreto. Es exactamente el mismo esquema del Tutor
Socrático — puedes usar la **misma cuenta y la misma clave**.

---

## ✅ Opción recomendada: Cloudflare Worker (gratis, 5 minutos)

### 1. Tener una API key de Anthropic
- Entra a https://console.anthropic.com → **API Keys** → **Create Key**.
- Copia la clave (empieza por `sk-ant-…`). *Puedes reutilizar la del Tutor Socrático.*

### 2. Crear el Worker
1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
2. Nómbralo, por ejemplo, **`ase-ia`**.
3. Pulsa **Edit code**, borra el ejemplo y **pega TODO** el contenido de
   [`ase-ia-worker.js`](./ase-ia-worker.js). Pulsa **Deploy**.

### 3. Guardar la clave como secreto
En el Worker → **Settings** → **Variables and Secrets** → **Add**:
- Tipo: **Secret**
- Nombre: **`ANTHROPIC_API_KEY`**
- Valor: tu clave `sk-ant-…`

Guarda y pulsa **Deploy** de nuevo.

### 4. Copiar la URL del Worker
Se ve así: `https://ase-ia.TU-CUENTA.workers.dev`
Puedes probarla abriéndola en el navegador (debe responder
`{"ok":true,"claveConfigurada":true,…}`).

### 5. Conectar la página
En [`ase-ia.html`](./ase-ia.html) busca la línea:

```js
const AI_PROXY_URL = "";
```

y reemplázala por la URL de tu Worker:

```js
const AI_PROXY_URL = "https://ase-ia.TU-CUENTA.workers.dev";
```

Guarda y publica. **¡Listo!** ASE-IA ya usa IA real online; si el proxy falla,
vuelve automáticamente al modo local.

---

## 🎓 Conectar el botón "Generar Ficha SIP con IA" (fichas de tutoría)

Mismo proceso, con su propio Worker (así cada herramienta tiene su propia clave
y sus propios límites, aunque puedes reutilizar la misma cuenta de Cloudflare
y la misma API key):

1. Crea un Worker nuevo (ej. **`fichas-tutoria`**) y pega el contenido de
   [`fichas-worker.js`](./fichas-worker.js).
2. Agrega el secreto `ANTHROPIC_API_KEY` igual que arriba. Deploy.
3. Copia la URL del Worker y pégala en [`fichas_JJP_v3_2.html`](./fichas_JJP_v3_2.html),
   en la constante:
   ```js
   const AI_PROXY_URL = "";
   ```
   reemplazándola por `"https://fichas-tutoria.TU-CUENTA.workers.dev"`.

Mientras `AI_PROXY_URL` esté vacía, el botón "Generar Ficha SIP con IA" muestra
un aviso claro en vez de fallar en silencio.

---

## 🔎 Cómo probar que quedó bien
1. Abre ASE-IA y pregunta *“¿Cuál es la nota mínima de aprobación?”*.
   - La respuesta será más natural y seguirá citando la fuente **[1]**.
2. Pregunta algo fuera de los documentos (*“¿capital de Francia?”*): debe seguir
   respondiendo **que no tiene esa información** (nunca inventa).

---

## 🔄 Usar OpenAI o Gemini en vez de Claude
Edita `ase-ia-worker.js` y cambia el bloque que llama a la IA:

- **OpenAI:** endpoint `https://api.openai.com/v1/chat/completions`, cabecera
  `Authorization: Bearer <clave>`, modelo `gpt-4o-mini`, secreto `OPENAI_API_KEY`.
- **Gemini:** endpoint
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=<clave>`,
  secreto `GEMINI_API_KEY`.

La lógica de grounding (usar solo las fuentes y citar `[n]`) se mantiene igual.

---

## 🔒 Seguridad
- La clave vive **solo** en el Worker (secreto), nunca en la página.
- `ALLOWED_ORIGINS` en `ase-ia-worker.js` limita qué sitios pueden usar tu proxy
  (ya incluye tu GitHub Pages y el dominio del colegio; agrega otros si publicas
  en más dominios).
- El grounding se mantiene: la IA solo recibe las fuentes autorizadas por el
  colegio; si no hay fuentes, responde “sin información”.

---

## 🚀 Alternativa avanzada: API completa (Node/Express)
Si prefieres un backend propio con RAG por embeddings, autenticación por roles y
panel de administración, está el proyecto completo en la carpeta
[`ase-ia/`](./ase-ia/) (monorepo). Ahí basta con definir `AI_PROVIDER=gemini|openai|anthropic`
y su clave. Ver [`ase-ia/docs/INSTALACION.md`](./ase-ia/docs/INSTALACION.md) y
[`ase-ia/docs/DESPLIEGUE.md`](./ase-ia/docs/DESPLIEGUE.md).

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

## 🎓 Login y botón "Generar análisis completo con IA" (fichas de tutoría)

**Fichas de Tutoría ya no tiene su propio login ni su propio Worker.** Es una
rama de ASE-IA: reutiliza el mismo `GOOGLE_CLIENT_ID` y el mismo Worker
(`ase-ia-worker.js`) que usa `ase-ia.html`, así no hay que crear nada nuevo en
Google Cloud ni en Cloudflare.

- **Login**: `fichas_JJP_v3_2.html` muestra el botón real de "Iniciar sesión
  con Google" (Google Identity Services) y verifica la cuenta llamando a
  `${ASE_IA_API_URL}?resource=me` — el mismo endpoint que usa ASE-IA. Solo
  entra el equipo del colegio (`role: staff` o `dev`).
- **Generar ficha con IA**: el botón llama a `${ASE_IA_API_URL}?resource=crear`
  del mismo Worker, mandando el `credential` de Google (para verificar que
  quien pide el análisis sigue siendo staff) junto con el prompt.
- Si se abre `fichas_JJP_v3_2.html` **desde ASE-IA** (mismo navegador, mismo
  dominio `aseia.cl`), no hay que volver a iniciar sesión: la sesión se
  comparte vía `localStorage` (`aseiaSession`).
- Si se abre **directo**, pide iniciar sesión con Google igual que ASE-IA.

Las constantes viven al inicio del bloque de sesión en `fichas_JJP_v3_2.html`:

```js
const GOOGLE_CLIENT_ID = "195849212680-....apps.googleusercontent.com";
const ASE_IA_API_URL = "https://ase-ia.TU-CUENTA.workers.dev";
```

Si alguna vez publicas Fichas de Tutoría en un dominio nuevo (además de
`aseia.cl`), agrégalo también a `ALLOWED_ORIGINS` en `ase-ia-worker.js` (ver
sección de Seguridad más abajo) o el Worker rechazará las peticiones por CORS.

### Alternativa: Worker propio y separado

Si en algún momento prefieres que Fichas de Tutoría tenga su propia clave y
sus propios límites (en vez de compartir el Worker de ASE-IA), puedes volver
al esquema anterior con [`fichas-worker.js`](./fichas-worker.js): créalo como
un Worker nuevo, agrega el secreto `ANTHROPIC_API_KEY` y ajusta el fetch del
botón "Generar análisis completo con IA" en `fichas_JJP_v3_2.html` para que
apunte a esa URL en vez de `ASE_IA_API_URL`. No es necesario para el
funcionamiento normal — el archivo se mantiene solo por si se necesita.

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

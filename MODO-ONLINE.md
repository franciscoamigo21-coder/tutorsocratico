# Activar el modo ONLINE (análisis de IA más específico)

El sitio funciona siempre, incluso sin internet (modo offline con preguntas
ancladas al texto). Para activar el análisis **online con IA** —preguntas aún
más específicas y profundas— sigue estos pasos **una sola vez**.

La clave de IA se guarda en un pequeño proxy gratuito (Cloudflare Worker), de
modo que **nunca queda expuesta** en la página pública.

## 1. Obtener una API key de Anthropic
- Entra a https://console.anthropic.com → **API Keys** → **Create Key**.
- Copia la clave (empieza por `sk-ant-...`). Guárdala en privado.

## 2. Crear el Worker en Cloudflare (gratis, sin instalar nada)
1. Entra a https://dash.cloudflare.com → **Workers & Pages** → **Create** →
   **Create Worker**. Nómbralo, por ejemplo, `tutor-socratico`.
2. Pulsa **Edit code**, borra el ejemplo y pega TODO el contenido de
   [`cloudflare-worker.js`](./cloudflare-worker.js). Pulsa **Deploy**.
3. En el Worker → **Settings** → **Variables and Secrets** → **Add**:
   - Tipo: **Secret**
   - Nombre: `ANTHROPIC_API_KEY`
   - Valor: tu clave `sk-ant-...`
   Guarda y vuelve a **Deploy**.
4. Copia la URL del Worker (algo como
   `https://tutor-socratico.TU-CUENTA.workers.dev`).

## 3. Conectar la página
En [`index.html`](./index.html) busca la línea:

```js
const API_PROXY_URL = "https://REEMPLAZA-CON-TU-WORKER.workers.dev";
```

y reemplázala por la URL real de tu Worker. Guarda y publica los cambios.
¡Listo! La página ya usará la IA online; si el proxy no está disponible, vuelve
automáticamente al modo offline.

> Seguridad: en `cloudflare-worker.js`, la lista `ALLOWED_ORIGINS` limita qué
> sitios pueden usar tu proxy. Ya incluye tu GitHub Pages y el dominio del
> colegio; agrega ahí cualquier otro dominio donde publiques la herramienta.

/**
 * ============================================================================
 *  FICHAS DE TUTORÍA · Proxy de IA para "Generar Ficha SIP con IA" (Cloudflare Worker)
 * ============================================================================
 *  Guarda en secreto tu API key (Anthropic) y es el ÚNICO que la conoce. La
 *  página fichas_JJP_v3_2.html le envía el prompt ya armado con los datos del
 *  estudiante, y este Worker le pide a la IA que redacte el análisis pedagógico.
 *  La clave jamás viaja al navegador.
 *
 *  CÓMO DESPLEGARLO (sin instalar nada — mismo proceso que ASE-IA y el Tutor
 *  Socrático, puedes reutilizar la MISMA cuenta de Cloudflare y la MISMA clave):
 *  1. https://dash.cloudflare.com → Workers & Pages → Create → Create Worker.
 *     Nómbralo, por ejemplo, "fichas-tutoria".
 *  2. Edit code → borra el ejemplo → pega TODO este archivo → Deploy.
 *  3. Settings → Variables and Secrets → Add:
 *        Tipo: Secret   Nombre: ANTHROPIC_API_KEY   Valor: tu clave sk-ant-...
 *     Guarda y vuelve a Deploy.
 *  4. Copia la URL del Worker (algo como
 *        https://fichas-tutoria.TU-CUENTA.workers.dev )
 *     y pégala en fichas_JJP_v3_2.html, en la constante AI_PROXY_URL.
 * ============================================================================
 */

const ALLOWED_ORIGINS = [
  "https://aseia.cl",
  "https://www.aseia.cl",
  "https://franciscoamigo21-coder.github.io",
];

const MODEL = "claude-sonnet-4-6";

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method === "GET") {
      return json({ ok: true, servicio: "Fichas de Tutoría Worker", claveConfigurada: !!env.ANTHROPIC_API_KEY, modelo: MODEL }, 200, cors);
    }
    if (request.method !== "POST") return json({ error: "Método no permitido" }, 405, cors);
    if (!env.ANTHROPIC_API_KEY) return json({ error: "Falta configurar ANTHROPIC_API_KEY" }, 500, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400, cors); }

    const prompt = (body.prompt || "").toString().slice(0, 6000);
    if (prompt.trim().length < 10) return json({ error: "Prompt vacío o demasiado corto" }, 400, cors);

    let aiResp;
    try {
      aiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
    } catch {
      return json({ error: "No se pudo contactar a la IA" }, 502, cors);
    }

    if (!aiResp.ok) {
      const errText = await aiResp.text().catch(() => "");
      return json({ error: "Error de la API de IA", detalle: errText.slice(0, 300) }, 502, cors);
    }

    const data = await aiResp.json();
    const text = (data.content || []).map((b) => b.text || "").join("").trim();
    return json({ text: text || "No se pudo generar el análisis." }, 200, cors);
  },
};

/**
 * ============================================================================
 *  ASE-IA · Proxy de chat con IA (Cloudflare Worker)
 * ============================================================================
 *  Guarda en secreto tu API key (Anthropic) y es el ÚNICO que la conoce. La
 *  página ase-ia.html le envía la pregunta + las FUENTES ya recuperadas del
 *  colegio, y este Worker le pide a la IA que redacte una respuesta anclada a
 *  esas fuentes (nunca inventa). La clave jamás viaja al navegador.
 *
 *  CÓMO DESPLEGARLO (sin instalar nada):
 *  1. https://dash.cloudflare.com → Workers & Pages → Create → Create Worker.
 *     Nómbralo, por ejemplo, "ase-ia".
 *  2. Edit code → borra el ejemplo → pega TODO este archivo → Deploy.
 *  3. Settings → Variables and Secrets → Add:
 *        Tipo: Secret   Nombre: ANTHROPIC_API_KEY   Valor: tu clave sk-ant-...
 *     (Puedes usar la MISMA clave del Tutor Socrático.) Guarda y Deploy.
 *  4. Copia la URL del Worker (https://ase-ia.TU-CUENTA.workers.dev) y pégala
 *     en ase-ia.html, en la constante AI_PROXY_URL.
 * ============================================================================
 */

const ALLOWED_ORIGINS = [
  "https://franciscoamigo21-coder.github.io",
  "https://www.josejoaquinprieto.cl",
  "https://josejoaquinprieto.cl",
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

const ROLE_TXT = {
  student: "El usuario es un ESTUDIANTE.",
  teacher: "El usuario es un DOCENTE.",
  guardian: "El usuario es un APODERADO.",
};

function systemPrompt(role) {
  return (
    `Eres ASE-IA, el Asistente Escolar de Inteligencia Artificial del Colegio ` +
    `Presidente José Joaquín Prieto (SIP Red de Colegios, Chile).\n` +
    `REGLAS ABSOLUTAS:\n` +
    `1. Responde ÚNICAMENTE con la información de las FUENTES AUTORIZADAS que ` +
    `recibas. PROHIBIDO inventar datos, fechas o normas.\n` +
    `2. Cita la fuente de cada afirmación con su marcador [n].\n` +
    `3. Si las fuentes no contienen la respuesta, dilo con honestidad y sugiere ` +
    `consultar al profesor jefe, secretaría o Alexia.\n` +
    `4. Español de Chile, tono claro, cercano y respetuoso. Sé conciso.\n` +
    `${ROLE_TXT[role] || ROLE_TXT.student}`
  );
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
      return json({ ok: true, servicio: "ASE-IA Worker", claveConfigurada: !!env.ANTHROPIC_API_KEY, modelo: MODEL }, 200, cors);
    }
    if (request.method !== "POST") return json({ error: "Método no permitido" }, 405, cors);
    if (!env.ANTHROPIC_API_KEY) return json({ error: "Falta configurar ANTHROPIC_API_KEY" }, 500, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400, cors); }

    const question = (body.question || "").toString().slice(0, 1000);
    const role = (body.role || "student").toString();
    const context = Array.isArray(body.context) ? body.context.slice(0, 6) : [];
    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

    if (question.trim().length < 2) return json({ error: "Pregunta vacía" }, 400, cors);
    if (context.length === 0) {
      return json({ reply: "No tengo información autorizada del establecimiento sobre eso. Consúltalo con tu profesor jefe, en secretaría o en Alexia." }, 200, cors);
    }

    const fuentes = context
      .map((c, i) => `[${i + 1}] ${c.titulo}: ${c.fragmento}`)
      .join("\n");
    const userContent =
      `PREGUNTA: ${question}\n\n` +
      `FUENTES AUTORIZADAS (usa solo estas y cita [n]):\n${fuentes}`;

    const messages = [];
    for (const h of history) {
      if (h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string") {
        messages.push({ role: h.role, content: h.content.slice(0, 1500) });
      }
    }
    messages.push({ role: "user", content: userContent });

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
          max_tokens: 700,
          system: systemPrompt(role),
          messages,
        }),
      });
    } catch {
      return json({ error: "No se pudo contactar a la IA" }, 502, cors);
    }

    if (!aiResp.ok) {
      let detalle = "";
      try { detalle = (await aiResp.text()).slice(0, 300); } catch {}
      return json({ error: `Error IA ${aiResp.status}`, detalle }, 502, cors);
    }

    const data = await aiResp.json();
    const block = (data.content || []).find((b) => b.type === "text");
    return json({ reply: (block?.text || "").trim() }, 200, cors);
  },
};

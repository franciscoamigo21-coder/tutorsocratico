/**
 * ============================================================================
 *  ASE-IA · PLANIFICA — Worker de CREACIÓN de material pedagógico con IA
 * ============================================================================
 *  Worker INDEPENDIENTE y autocontenido. NO usa el directorio de estudiantes,
 *  así que es imposible que afecte los datos del colegio. Solo crea material
 *  para docentes (planificaciones, guías, rúbricas, OA y presentaciones).
 *
 *  CÓMO DESPLEGARLO (2 minutos):
 *  1. dash.cloudflare.com → Workers & Pages → Create → Create Worker.
 *     Nómbralo EXACTAMENTE:  ase-ia-planifica
 *     (así la URL queda https://ase-ia-planifica.franciscoamigo21.workers.dev,
 *      que ya está configurada en la página).
 *  2. Edit code → borra el ejemplo → pega TODO este archivo → Deploy.
 *  3. Settings → Variables and Secrets → Add:
 *        Tipo: Secret   Nombre: ANTHROPIC_API_KEY   Valor: tu clave sk-ant-...
 *     (la MISMA clave de tu Worker principal). Guarda y Deploy.
 *  4. (OPCIONAL) Imágenes IA en las presentaciones (portada + secciones):
 *        Tipo: Secret   Nombre: GEMINI_API_KEY   Valor: tu clave de Google AI Studio
 *     Sin esta clave, las presentaciones se crean igual con su diseño editorial
 *     (solo que sin ilustraciones generadas por IA). Tiene costo por imagen.
 *  Listo: PLANIFICA vuelve a crear material y presentaciones.
 * ============================================================================
 */

const ALLOWED_ORIGINS = [
  "https://franciscoamigo21-coder.github.io",
  "https://www.josejoaquinprieto.cl",
  "https://josejoaquinprieto.cl",
  "https://aseia.cl",
  "https://www.aseia.cl",
];
const MODEL = "claude-sonnet-4-6";
// Modelo de imágenes de Google (Gemini / Imagen). Requiere el secreto GEMINI_API_KEY.
// Si quieres imágenes más baratas/rápidas usa "imagen-3.0-fast-generate-001".
const IMAGE_MODEL = "imagen-3.0-generate-002";
const GOOGLE_CLIENT_ID = "195849212680-sjfflsv7f96o6742l67ihj5kllitpvj4.apps.googleusercontent.com";
const DEV_EMAILS = ["franciscoamigo21@gmail.com", "paulina.devia@sip.cl", "jcid@sip.cl", "camila.ortiz@sip.cl", "cesar.cid@sip.cl"];

async function verifyGoogle(credential) {
  if (!credential || typeof credential !== "string") return null;
  try {
    const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
    if (!r.ok) return null;
    const c = await r.json();
    if (c.aud !== GOOGLE_CLIENT_ID) return null;
    if (String(c.email_verified) !== "true") return null;
    if (!c.exp || Number(c.exp) * 1000 < Date.now()) return null;
    return { email: (c.email || "").toLowerCase(), name: c.name || "" };
  } catch { return null; }
}
// Rol mínimo (sin directorio): docentes/administrativos = @sip.cl; maestros = DEV_EMAILS.
function roleOf(email) {
  const dom = (email.split("@")[1] || "");
  if (DEV_EMAILS.includes(email)) return "dev";
  if (dom === "sip.cl" || dom.endsWith(".sip.cl")) return "staff";
  return "other";
}
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
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors } });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method === "GET") {
      return json({ ok: true, servicio: "ASE-IA PLANIFICA Worker", claveConfigurada: !!env.ANTHROPIC_API_KEY, modelo: MODEL }, 200, cors);
    }
    if (request.method !== "POST") return json({ error: "Método no permitido" }, 405, cors);
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: "Origen no autorizado" }, 403, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400, cors); }

    // Solo docentes/administrativos/maestros pueden crear material.
    const u = await verifyGoogle(body.credential);
    if (!u) return json({ error: "No pudimos verificar tu cuenta." }, 401, cors);
    const role = roleOf(u.email);
    if (role !== "staff" && role !== "dev") return json({ error: "No autorizado" }, 403, cors);

    // ---- Ranking del mini-juego, compartido por todo el colegio (usa el KV RANKING) ----
    if (body.resource === "score" || body.resource === "ranking") {
      if (!env.RANKING) return json({ error: "sin-kv" }, 200, cors); // la pagina usa respaldo local
      const KEY = "board";
      let board = {};
      try { const raw = await env.RANKING.get(KEY); if (raw) board = JSON.parse(raw) || {}; } catch {}
      if (body.resource === "score") {
        const pts = Math.max(0, Math.min(100000, parseInt(body.points, 10) || 0));
        const name = (u.name || (u.email.split("@")[0] || "Docente")).toString().slice(0, 60);
        const cur = board[u.email] || { name: name, best: 0 };
        if (pts > (cur.best || 0)) cur.best = pts;
        cur.name = name;
        board[u.email] = cur;
        try { await env.RANKING.put(KEY, JSON.stringify(board)); } catch {}
      }
      const ranking = Object.keys(board)
        .map((e) => ({ email: e, name: board[e].name, best: board[e].best || 0 }))
        .sort((a, b) => (b.best || 0) - (a.best || 0))
        .slice(0, 20);
      return json({ ok: true, ranking: ranking, me: u.email }, 200, cors);
    }

    // ---- Ilustraciones con IA (Google Imagen) para portada y secciones ----
    if (body.resource === "image") {
      if (!env.GEMINI_API_KEY) return json({ error: "sin-imagen" }, 200, cors); // la pagina omite las imagenes
      const iprompt = (body.prompt || "").toString().slice(0, 1200);
      if (iprompt.trim().length < 3) return json({ error: "prompt-vacio" }, 400, cors);
      const aspect = ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(body.aspect) ? body.aspect : "16:9";
      let ir;
      try {
        ir = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/" + IMAGE_MODEL + ":predict?key=" + encodeURIComponent(env.GEMINI_API_KEY),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instances: [{ prompt: iprompt }], parameters: { sampleCount: 1, aspectRatio: aspect } }),
          }
        );
      } catch {
        return json({ error: "no-conexion-imagen" }, 200, cors);
      }
      if (!ir.ok) {
        let d = ""; try { d = (await ir.text()).slice(0, 200); } catch {}
        return json({ error: "img-" + ir.status, detalle: d }, 200, cors);
      }
      let idata; try { idata = await ir.json(); } catch { return json({ error: "img-parse" }, 200, cors); }
      const pred = (idata && idata.predictions && idata.predictions[0]) || null;
      const b64 = pred && (pred.bytesBase64Encoded || (pred.image && pred.image.bytesBase64Encoded));
      if (!b64) return json({ error: "sin-datos-imagen" }, 200, cors);
      const mime = (pred && pred.mimeType) || "image/png";
      return json({ image: "data:" + mime + ";base64," + b64 }, 200, cors);
    }

    // ---- Tutor Socrático: diálogo que guía con preguntas (no entrega la respuesta hecha) ----
    if (body.resource === "tutor") {
      if (!env.ANTHROPIC_API_KEY) return json({ error: "Falta configurar ANTHROPIC_API_KEY" }, 500, cors);
      const sysTutor =
        "Eres el TUTOR SOCRÁTICO de ASE-IA, del Colegio Presidente José Joaquín Prieto (SIP Red de Colegios). " +
        "Tu método es socrático: acompañas el aprendizaje mediante PREGUNTAS que hacen pensar, NO entregando la " +
        "respuesta hecha. Guías paso a paso para que la persona razone, argumente y defienda sus ideas. " +
        "Reglas: 1) Responde breve (2 a 5 frases) y termina casi siempre con UNA pregunta que haga avanzar el " +
        "razonamiento. 2) No resuelvas tareas ni entregues la respuesta final directamente; si insisten, ofrece una " +
        "pista y otra pregunta. 3) Valora los intentos, corrige con amabilidad y reformula si la persona se traba. " +
        "4) Adapta el lenguaje a estudiantes escolares; sé cercano, motivador y respetuoso. 5) Español de Chile, " +
        "claro y sin tecnicismos innecesarios. 6) Si el tema es sensible o de seguridad, deriva con criterio a un " +
        "adulto o profesional. Mantén el foco en que la persona construya su propio aprendizaje.";
      const hist = Array.isArray(body.history)
        ? body.history.slice(-12).map((m) => ({
            role: m && m.role === "assistant" ? "assistant" : "user",
            content: String((m && m.content) || "").slice(0, 2000),
          })).filter((m) => m.content)
        : [];
      const q = (body.question || "").toString().slice(0, 3000);
      if (q.trim().length < 1) return json({ error: "vacio" }, 400, cors);
      const messages = hist.concat([{ role: "user", content: q }]);
      let aiT;
      try {
        aiT = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: MODEL, max_tokens: 700, system: sysTutor, messages }),
        });
      } catch {
        return json({ error: "No se pudo contactar a la IA" }, 502, cors);
      }
      if (!aiT.ok) {
        let d = ""; try { d = (await aiT.text()).slice(0, 200); } catch {}
        return json({ error: "Error IA " + aiT.status, detalle: d }, 502, cors);
      }
      const dt = await aiT.json();
      const bt = (dt.content || []).find((b) => b.type === "text");
      return json({ reply: (bt && bt.text ? bt.text : "").trim() }, 200, cors);
    }

    if (!env.ANTHROPIC_API_KEY) return json({ error: "Falta configurar ANTHROPIC_API_KEY" }, 500, cors);

    const prompt = (body.prompt || body.question || "").toString().slice(0, 4000);
    if (prompt.trim().length < 3) return json({ error: "Solicitud vacía" }, 400, cors);

    const sysCrear =
      `Eres un asesor pedagógico experto en el currículum nacional de Chile ` +
      `(MINEDUC, Bases Curriculares) del Colegio Presidente José Joaquín Prieto. ` +
      `Tu tarea es CREAR material educativo de alta calidad para docentes: ` +
      `planificaciones de clase, guías de trabajo, rúbricas de evaluación, ` +
      `objetivos de aprendizaje (OA) y guiones de presentación. ` +
      `IMPORTANTE: siempre CREAS el material solicitado; nunca pides datos al ` +
      `usuario ni lo derives a terceros. Alinea todo a los OA del nivel indicado. ` +
      `Escribe en español de Chile, claro, concreto y listo para usar. Usa formato ` +
      `Markdown: encabezados con ##, subtítulos con ###, listas con - o números, ` +
      `negritas con **texto** y tablas con | y fila separadora |---|---| cuando ` +
      `ayude (por ejemplo, en rúbricas). Si te piden un objeto JSON, responde ` +
      `EXCLUSIVAMENTE con el JSON válido, sin texto adicional ni bloques de código. ` +
      `Sé práctico y pertinente al nivel.`;

    let aiC;
    try {
      aiC = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 6000,
          system: sysCrear,
          messages: [{ role: "user", content: prompt }],
        }),
      });
    } catch {
      return json({ error: "No se pudo contactar a la IA" }, 502, cors);
    }
    if (!aiC.ok) {
      let d = ""; try { d = (await aiC.text()).slice(0, 300); } catch {}
      return json({ error: `Error IA ${aiC.status}`, detalle: d }, 502, cors);
    }
    const dc = await aiC.json();
    const bc = (dc.content || []).find((b) => b.type === "text");
    return json({ reply: (bc?.text || "").trim() }, 200, cors);
  },
};

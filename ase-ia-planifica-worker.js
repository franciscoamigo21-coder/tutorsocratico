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
 *  Listo: PLANIFICA vuelve a crear material y presentaciones.
 * ============================================================================
 */

const ALLOWED_ORIGINS = [
  "https://franciscoamigo21-coder.github.io",
  "https://www.josejoaquinprieto.cl",
  "https://josejoaquinprieto.cl",
];
const MODEL = "claude-sonnet-4-6";
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
  if (dom === "sip.cl") return "staff";
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

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

/* ============================================================================
 *  DIRECTORIO DE ESTUDIANTES (privado, opcional)
 *  Aquí va la lista de estudiantes del colegio para que el redactor de correos
 *  autocomplete el nombre y el correo. Vive SOLO en este Worker (su código no es
 *  público) y jamás se publica en la página ni en GitHub. Cada entrada:
 *     {n:"Nombre Apellido", c:"CÓDIGO CURSO", e:"correo@alumnos.sip.cl", ae:"correo apoderado"}
 *  Reemplaza [] por la lista real (te la entrego lista para pegar). Si lo dejas
 *  vacío, el redactor sigue funcionando pidiendo el nombre a mano.
 *  El endpoint solo responde a los ORÍGENES del colegio (ALLOWED_ORIGINS).
 * ========================================================================== */
const DIRECTORY = [];

/* ============================================================================
 *  SEGURIDAD · Verificación del inicio de sesión en el SERVIDOR
 *  Google firma un token cuando alguien inicia sesión. Aquí verificamos ese
 *  token contra Google (firma, vigencia y que sea de ESTA app). Así nadie puede
 *  hacerse pasar por otra persona ni pedir datos de otro. Cada quien solo recibe
 *  lo suyo: el estudiante su propio perfil (por su correo @alumnos.sip.cl del
 *  documento Cuentas), y el apoderado solo su(s) pupilo(s) (por su correo en la
 *  Planilla de Matrículas). El GOOGLE_CLIENT_ID debe ser el mismo de la página.
 * ========================================================================== */
const GOOGLE_CLIENT_ID = "195849212680-sjfflsv7f96o6742l67ihj5kllitpvj4.apps.googleusercontent.com";
const DEV_EMAILS = ["franciscoamigo21@gmail.com"]; // correos de administración
async function verifyGoogle(credential) {
  if (!credential || typeof credential !== "string") return null;
  try {
    const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
    if (!r.ok) return null;
    const c = await r.json();
    if (c.aud !== GOOGLE_CLIENT_ID) return null;            // el token es de OTRA app
    if (String(c.email_verified) !== "true") return null;   // correo no verificado
    if (!c.exp || Number(c.exp) * 1000 < Date.now()) return null; // token vencido
    return { email: (c.email || "").toLowerCase(), name: c.name || "", picture: c.picture || "" };
  } catch { return null; }
}
function profileFor(u) {
  const email = u.email, dom = email.split("@")[1] || "";
  if (DEV_EMAILS.includes(email)) return { role: "dev", email, name: u.name, picture: u.picture };
  if (dom === "sip.cl") return { role: "staff", email, name: u.name, picture: u.picture };
  if (dom === "alumnos.sip.cl") {
    const s = DIRECTORY.find((x) => (x.e || "").toLowerCase() === email);
    return { role: "student", email, name: u.name, picture: u.picture, student: s ? { name: s.n, course: s.c } : null };
  }
  const pupils = DIRECTORY.filter((x) => (x.ae || "").toLowerCase() === email).map((x) => ({ name: x.n, course: x.c }));
  return { role: "guardian", email, name: u.name, picture: u.picture, pupils };
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
    `2. Usa toda la información PERTINENTE de las fuentes para responder, aunque la ` +
    `pregunta esté redactada de otra forma: relaciona, resume y explica lo que sí ` +
    `aparezca en ellas. Solo si NINGUNA de las fuentes se relaciona con el tema, ` +
    `dilo con honestidad y sugiere consultar al profesor jefe, secretaría o Alexia.\n` +
    `3. Español de Chile, con un tono formal, serio y respetuoso, propio de una ` +
    `institución educativa. Claro y cercano, pero nunca informal ni jocoso.\n` +
    `4. SÉ PRECISO Y BREVE: 2 a 3 frases, directo al grano, sin relleno. Pon ` +
    `SIEMPRE primero lo más importante (la respuesta o el dato clave) y luego, si ` +
    `hace falta, un detalle. La página muestra las fuentes en tarjetas aparte, así ` +
    `que NO repitas el texto completo del reglamento ni enumeres todo.\n` +
    `5. FORMATO: texto plano corrido, como un mensaje humano. PROHIBIDO usar ` +
    `caracteres especiales de formato: nada de #, **negritas**, *asteriscos*, ` +
    `guiones - como viñeta o separador, viñetas • ni marcadores [n]. Usa solo ` +
    `frases normales con su punto final. SOLO se permite, cuando ayude a comparar ` +
    `datos, una tabla Markdown simple con | y una fila separadora |---|---| ` +
    `(la página la muestra como cuadro).\n` +
    `6. Si te piden redactar un correo, entrega un borrador breve con lo más ` +
    `importante primero (motivo y fecha), en 3 o 4 líneas, cordial y claro.\n` +
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

    const url = new URL(request.url);
    const resource = url.searchParams.get("resource");
    const secure = { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors };

    if (request.method === "GET") {
      return json({ ok: true, servicio: "ASE-IA Worker", claveConfigurada: !!env.ANTHROPIC_API_KEY, modelo: MODEL }, 200, cors);
    }
    if (request.method !== "POST") return json({ error: "Método no permitido" }, 405, cors);
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: "Origen no autorizado" }, 403, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400, cors); }

    // ---- Mi perfil verificado: cada quien recibe SOLO lo suyo ----
    if (resource === "me") {
      const u = await verifyGoogle(body.credential);
      if (!u) return json({ error: "No pudimos verificar tu cuenta de Google." }, 401, cors);
      return new Response(JSON.stringify(profileFor(u)), { status: 200, headers: secure });
    }
    // ---- Directorio completo (con correos): solo docentes/administrativos ----
    if (resource === "directory") {
      const u = await verifyGoogle(body.credential);
      if (!u) return json({ error: "No pudimos verificar tu cuenta." }, 401, cors);
      const p = profileFor(u);
      if (p.role !== "staff" && p.role !== "dev") return json({ error: "No autorizado" }, 403, cors);
      return new Response(JSON.stringify({ students: DIRECTORY }), { status: 200, headers: secure });
    }

    // ---- Chat con IA (por defecto) ----
    if (!env.ANTHROPIC_API_KEY) return json({ error: "Falta configurar ANTHROPIC_API_KEY" }, 500, cors);
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
      `FUENTES AUTORIZADAS (basa tu respuesta solo en estas; NO las copies literal ` +
      `ni cites [n], solo resume lo pertinente):\n${fuentes}`;

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
          max_tokens: 420,
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

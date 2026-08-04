/**
 * ============================================================================
 *  TUTOR SOCRÁTICO ASE-IA · Proxy serverless (Cloudflare Worker)
 * ============================================================================
 *  Este Worker guarda en secreto la API key de Anthropic y es el ÚNICO que la
 *  conoce. La página web (index.html) le envía solo el texto del estudiante y
 *  recibe de vuelta las preguntas de reflexión. La clave nunca viaja al
 *  navegador ni queda en el repositorio público.
 *
 *  CÓMO DESPLEGARLO (sin instalar nada):
 *  1. Entra a https://dash.cloudflare.com  ->  Workers & Pages  ->  Create
 *     -> Create Worker. Ponle un nombre (ej: "tutor-socratico").
 *  2. Pulsa "Edit code", borra el ejemplo y pega TODO este archivo. Deploy.
 *  3. En el Worker -> Settings -> Variables and Secrets -> Add:
 *        Tipo: Secret   Nombre: ANTHROPIC_API_KEY   Valor: tu clave sk-ant-...
 *     Guarda y vuelve a Deploy.
 *  4. Copia la URL del Worker (algo como
 *        https://tutor-socratico.TU-CUENTA.workers.dev )
 *     y pégala en index.html en la constante API_PROXY_URL.
 * ============================================================================
 */

// Orígenes autorizados a usar este proxy (evita que terceros gasten tu clave).
// Agrega aquí tu URL de GitHub Pages y el dominio del colegio.
const ALLOWED_ORIGINS = [
  "https://franciscoamigo21-coder.github.io",
  "https://aseia.cl",
  "https://www.aseia.cl",
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

const SYSTEM_PROMPT = `Eres el "Tutor Socrático" del Colegio Presidente José Joaquín Prieto (SIP Red de Colegios, La Pintana, Chile). Tu propósito es FORMATIVO: ayudar a que el estudiante reflexione y demuestre, con sus propias palabras, que comprende y es autor de su texto.

TAREA: Lee con atención el texto del estudiante y redacta 4 preguntas de reflexión y defensa oral PROFUNDAS y TOTALMENTE ANCLADAS al contenido REAL del texto.

REGLAS ESTRICTAS:
1. Cada pregunta DEBE referirse a algo concreto y verificable del texto: una frase exacta, un dato o cifra, un nombre propio, un ejemplo, un término técnico o un argumento puntual que el estudiante haya escrito. Cita o parafrasea ese elemento dentro de la pregunta. PROHIBIDO hacer preguntas genéricas que sirvan para cualquier texto.
2. Cubre cuatro ángulos distintos, uno por pregunta:
   (a) COMPRENSIÓN: que explique con sus palabras un concepto clave que usó.
   (b) EVIDENCIA/FUENTE: de dónde sacó un dato o afirmación concreta y por qué es confiable.
   (c) APLICACIÓN: una consecuencia o ejemplo real, de su vida cotidiana, que NO esté en el texto.
   (d) REFLEXIÓN PERSONAL/CRÍTICA: su opinión propia, una debilidad de su argumento o qué aprendió.
3. Escribe en español de Chile, con tono respetuoso y motivador, apropiado para escolares. Nada punitivo.
4. Si el estudiante no escribió el texto, no debería poder responder estas preguntas con detalle.
5. Adapta la exigencia al nivel de alerta indicado por el usuario, pero SIN mencionar IA ni detección dentro de las preguntas.
6. Responde SOLO con JSON válido, sin markdown ni texto adicional.

FORMATO EXACTO:
{"preguntas_defensa":["...","...","...","..."]}`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    // Chequeo de salud: abrir la URL del Worker en el navegador (GET) muestra
    // si la clave está configurada y qué modelo usa, SIN exponer la clave.
    if (request.method === "GET") {
      return json({
        ok: true,
        servicio: "Tutor Socratico Worker",
        claveConfigurada: !!env.ANTHROPIC_API_KEY,
        modelo: MODEL,
      }, 200, cors);
    }
    if (request.method !== "POST") {
      return json({ error: "Método no permitido" }, 405, cors);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "Falta configurar ANTHROPIC_API_KEY" }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return json({ error: "JSON inválido" }, 400, cors);
    }

    const texto = (body.texto || "").toString().slice(0, 4000);
    const nivelAlerta = (body.nivelAlerta || "BAJA").toString().slice(0, 80);
    const clicheList = Array.isArray(body.clicheList)
      ? body.clicheList.slice(0, 8).map((c) => String(c).slice(0, 60))
      : [];

    if (texto.trim().length < 80) {
      return json({ error: "Texto demasiado corto" }, 400, cors);
    }

    const userContent =
      `NIVEL DE ALERTA INTERNO (no mencionar en las preguntas): ${nivelAlerta}\n` +
      `Marcadores detectados: ${clicheList.length ? clicheList.join(", ") : "ninguno"}\n\n` +
      `TEXTO DEL ESTUDIANTE:\n"""\n${texto}\n"""\n\n` +
      `Genera el JSON con exactamente 4 preguntas.`;

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
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }],
        }),
      });
    } catch (e) {
      return json({ error: "No se pudo contactar a la IA" }, 502, cors);
    }

    if (!aiResp.ok) {
      let detalle = "";
      try { detalle = (await aiResp.text()).slice(0, 400); } catch (_) {}
      return json({ error: `Error IA ${aiResp.status}`, detalle }, 502, cors);
    }

    const data = await aiResp.json();
    const block = (data.content || []).find((b) => b.type === "text");
    if (!block) {
      return json({ error: "Respuesta vacía de la IA" }, 502, cors);
    }

    let raw = block.text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      return json({ error: "La IA no devolvió JSON válido" }, 502, cors);
    }

    if (!Array.isArray(parsed.preguntas_defensa) || parsed.preguntas_defensa.length === 0) {
      return json({ error: "Estructura inválida" }, 502, cors);
    }

    return json({ preguntas_defensa: parsed.preguntas_defensa.slice(0, 4) }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

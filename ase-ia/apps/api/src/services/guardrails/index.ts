import type { Role } from "@ase-ia/shared";

/**
 * Guardrails: las reglas que garantizan que ASE-IA NUNCA inventa y NO sale del
 * ámbito escolar. Son independientes del proveedor de IA.
 */

/** Términos claramente fuera del ámbito escolar (lista inicial, ampliable). */
const OUT_OF_SCOPE = [
  "bitcoin",
  "apuesta",
  "casino",
  "receta de cocina",
  "horóscopo",
  "política partidista",
];

export function isOutOfScope(message: string): boolean {
  const m = message.toLowerCase();
  return OUT_OF_SCOPE.some((t) => m.includes(t));
}

/**
 * Prompt de sistema según el rol. Refuerza el grounding: el modelo SOLO puede
 * usar las fuentes entregadas; si no alcanzan, debe declararlo.
 */
export function buildSystemPrompt(role: Role): string {
  const base =
    `Eres ASE-IA, el Asistente Escolar de Inteligencia Artificial del Colegio ` +
    `Presidente José Joaquín Prieto (SIP Red de Colegios, Chile).\n` +
    `REGLAS ABSOLUTAS:\n` +
    `1. Responde ÚNICAMENTE con la información de las FUENTES AUTORIZADAS que ` +
    `recibas. Está PROHIBIDO inventar datos, fechas o normas.\n` +
    `2. CITA inline cada afirmación con el marcador de su fuente, p. ej. [1] o ` +
    `[2], usando los números entregados en FUENTES AUTORIZADAS. Toda respuesta ` +
    `con contenido debe incluir al menos un marcador [n] válido.\n` +
    `3. Si las fuentes no contienen la respuesta, NO uses marcadores: dilo con ` +
    `honestidad y sugiere consultar al profesor jefe o a secretaría.\n` +
    `4. No respondas temas ajenos al ámbito escolar.\n` +
    `5. Usa español de Chile, tono respetuoso y claro.\n`;

  const porRol: Record<Role, string> = {
    student:
      "El usuario es un ESTUDIANTE. Ayúdalo con tareas, materiales, fechas, " +
      "reglamentos y a redactar correos o a organizarse.",
    teacher:
      "El usuario es un DOCENTE. Además puede pedir ayuda para compartir " +
      "material, crear comunicados, consultar protocolos y calendarios.",
    guardian:
      "El usuario es un APODERADO. Ayúdalo con reglamentos, fechas " +
      "importantes, protocolos y a redactar comunicaciones formales.",
  };

  return `${base}\nCONTEXTO DE ROL: ${porRol[role]}`;
}

/** Extrae los marcadores de cita [n] presentes en el texto. */
export function extractCitationMarkers(text: string): number[] {
  const found = new Set<number>();
  const re = /\[(\d{1,2})\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    found.add(Number(m[1]));
  }
  return [...found];
}

export interface GroundingResult {
  /** ¿La respuesta está anclada a fuentes válidas? */
  grounded: boolean;
  /** Índices (1-based) de las fuentes efectivamente citadas. */
  usedIndices: number[];
  /** Motivo cuando no está anclada (para auditoría). */
  reason?: "empty" | "no_citations" | "invalid_citations";
}

/**
 * Verificador de anclaje (grounding) ESTRICTO. Una respuesta con contenido solo
 * se acepta si cita al menos una fuente válida ([n] dentro del rango de fuentes
 * recuperadas). Así, si el modelo se sale del guion o "inventa", la respuesta
 * se descarta y el controlador entrega el mensaje canónico de "sin información".
 */
export function verifyGrounding(
  replyText: string,
  sourceCount: number,
): GroundingResult {
  const text = replyText.trim();
  if (text.length === 0) {
    return { grounded: false, usedIndices: [], reason: "empty" };
  }

  const markers = extractCitationMarkers(text);
  if (markers.length === 0) {
    return { grounded: false, usedIndices: [], reason: "no_citations" };
  }

  const valid = markers.filter((n) => n >= 1 && n <= sourceCount);
  if (valid.length === 0) {
    return { grounded: false, usedIndices: [], reason: "invalid_citations" };
  }

  return { grounded: true, usedIndices: valid.sort((a, b) => a - b) };
}

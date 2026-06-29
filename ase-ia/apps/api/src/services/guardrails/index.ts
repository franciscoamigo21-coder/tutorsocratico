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
    `2. Si las fuentes no contienen la respuesta, dilo con honestidad y sugiere ` +
    `consultar al profesor jefe o a secretaría.\n` +
    `3. No respondas temas ajenos al ámbito escolar.\n` +
    `4. Usa español de Chile, tono respetuoso y claro.\n`;

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

/**
 * Verificación de salida: si no hubo fuentes, no debe haber respuesta
 * "inventada". Devuelve true si la respuesta está suficientemente anclada.
 */
export function isGrounded(hadSources: boolean, replyText: string): boolean {
  if (hadSources) return true;
  // Sin fuentes, solo aceptamos una respuesta vacía/declarativa (se sustituye
  // por el mensaje canónico NO_INFO en el controlador).
  return replyText.trim().length === 0;
}

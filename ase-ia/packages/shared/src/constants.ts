/** Constantes institucionales y de configuración compartida. */

export const APP_NAME = "ASE-IA";
export const APP_LONG_NAME = "Asistente Escolar de Inteligencia Artificial";

export const INSTITUTION = {
  colegio: "Colegio Presidente José Joaquín Prieto",
  red: "SIP Red de Colegios",
  pais: "Chile",
};

/** Paleta institucional (azul / blanco / gris claro). */
export const BRAND = {
  blue: "#1b3a66",
  blueBright: "#4fc3f7",
  white: "#ffffff",
  grayLight: "#f1f4f9",
  grayBorder: "#d9e1ec",
};

/**
 * Mensaje canónico cuando no hay información autorizada.
 * ASE-IA NUNCA inventa: si no hay fuente, responde esto.
 */
export const NO_INFO_MESSAGE =
  "No tengo información autorizada por el establecimiento sobre eso. " +
  "Te sugiero consultarlo directamente con tu profesor jefe o en secretaría.";

export const OUT_OF_SCOPE_MESSAGE =
  "Solo puedo ayudarte con temas escolares del establecimiento (tareas, " +
  "documentos, reglamentos, fechas, comunicaciones y organización).";

/**
 * Contratos de la API HTTP entre clientes (web/widget) y el servidor Express.
 * Mantener sincronizado con apps/api/src/routes.
 */
import type { Citation, ChatMessage, Role } from "./types.js";

/** POST /api/chat */
export interface ChatRequest {
  message: string;
  /** Historial reciente para dar contexto conversacional. */
  history?: Pick<ChatMessage, "role" | "content">[];
}

export interface ChatResponse {
  reply: string;
  citations: Citation[];
  resultado: "answered" | "no_info" | "out_of_scope" | "error";
  proveedorIA: string;
}

/** GET /api/health */
export interface HealthResponse {
  ok: boolean;
  service: string;
  version: string;
  aiProvider: string;
  aiConfigured: boolean;
}

/** Forma estándar de error de la API. */
export interface ApiError {
  error: string;
  detail?: string;
}

/** Información de sesión expuesta al cliente tras autenticar. */
export interface SessionInfo {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  schoolId: string;
}

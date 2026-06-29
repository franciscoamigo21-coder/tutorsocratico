// Re-exports explícitos: permiten el enlace estático de ESM tanto con tsx (dev)
// como con tsc (build), y favorecen el tree-shaking.

// Valores en runtime
export { ROLES } from "./types.js";
export {
  APP_NAME,
  APP_LONG_NAME,
  INSTITUTION,
  BRAND,
  NO_INFO_MESSAGE,
  OUT_OF_SCOPE_MESSAGE,
} from "./constants.js";

// Tipos (se borran en compilación)
export type {
  Role,
  User,
  DocumentType,
  KnowledgeDocument,
  DocumentChunk,
  Citation,
  ChatRole,
  ChatMessage,
  AuditLog,
} from "./types.js";
export type {
  ChatRequest,
  ChatResponse,
  HealthResponse,
  ApiError,
  SessionInfo,
} from "./contracts.js";

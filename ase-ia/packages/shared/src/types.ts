/**
 * Tipos de dominio de ASE-IA, compartidos por web, widget y API.
 * Fuente única de verdad para los contratos del sistema.
 */

/** Perfiles de usuario reconocidos por el establecimiento. */
export type Role = "student" | "teacher" | "guardian";

export const ROLES: Role[] = ["student", "teacher", "guardian"];

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  /** Permite escalar a múltiples establecimientos sin reescrituras. */
  schoolId: string;
}

/** Tipos de documento que forman la base de conocimiento institucional. */
export type DocumentType =
  | "reglamento_interno"
  | "pei"
  | "protocolo"
  | "programa_estudio"
  | "manual"
  | "rubrica"
  | "calendario"
  | "otro";

export interface KnowledgeDocument {
  id: string;
  schoolId: string;
  titulo: string;
  tipo: DocumentType;
  /** URL de origen (Drive, Storage, etc.). */
  url?: string;
  /** Roles que pueden ver/consultar este documento. */
  visibleParaRoles: Role[];
  status: "pending" | "indexed" | "error";
  createdAt: string;
}

/** Fragmento indexado de un documento (base para RAG). */
export interface DocumentChunk {
  id: string;
  docId: string;
  texto: string;
  /** Embedding vectorial; vacío hasta implementar RAG (M5). */
  embedding?: number[];
  metadata: {
    titulo: string;
    tipo: DocumentType;
    posicion: number;
  };
}

/** Una fuente citada que respalda una respuesta (grounding). */
export interface Citation {
  /** Número de cita (1-based) referenciado inline en la respuesta como [n]. */
  index: number;
  docId: string;
  titulo: string;
  fragmento: string;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  citations?: Citation[];
  createdAt: string;
}

/** Registro de auditoría por consulta (seguridad / "nunca inventar"). */
export interface AuditLog {
  id: string;
  uid: string;
  role: Role;
  schoolId: string;
  consulta: string;
  resultado: "answered" | "no_info" | "out_of_scope" | "error";
  fuentesCitadas: string[];
  proveedorIA: string;
  timestamp: string;
}

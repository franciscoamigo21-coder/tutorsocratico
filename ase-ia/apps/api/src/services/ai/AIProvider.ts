/**
 * Contrato común a todos los proveedores de IA.
 * El orquestador (ChatService) depende SOLO de esta interfaz, nunca de un
 * proveedor concreto. Cambiar de Gemini a OpenAI = cambiar una env var.
 */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateInput {
  /** Instrucciones de sistema (rol, reglas, "nunca inventar"). */
  system: string;
  /** Pregunta del usuario. */
  prompt: string;
  /** Fragmentos recuperados de la base de conocimiento (grounding). */
  context: string[];
  /** Historial conversacional reciente (para dar continuidad). */
  history?: ChatTurn[];
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
  /** Nombre del proveedor que respondió (para auditoría). */
  provider: string;
}

export interface AIProvider {
  readonly name: string;
  /** ¿Tiene clave/credenciales configuradas? */
  isConfigured(): boolean;
  /** Redacta una respuesta anclada al contexto entregado. */
  generate(input: GenerateInput): Promise<GenerateResult>;
  /** Embedding para RAG (M5). Opcional hasta entonces. */
  embed?(text: string): Promise<number[]>;
}

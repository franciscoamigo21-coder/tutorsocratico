import type {
  ChatRequest,
  ChatResponse,
  KnowledgeDocument,
  SessionInfo,
} from "@ase-ia/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Token actual; lo mantiene useAuth. null = modo invitado (fallback dev). */
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) h.Authorization = `Bearer ${authToken}`;
  return h;
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Consulta principal de chat. */
export async function sendChat(payload: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return parse<ChatResponse>(res);
}

/** Devuelve la sesión (rol, establecimiento) del usuario autenticado. */
export async function fetchSession(): Promise<SessionInfo> {
  const res = await fetch(`${API_URL}/api/auth/session`, { headers: headers() });
  return parse<SessionInfo>(res);
}

/** Lista los documentos de la base de conocimiento visibles para el rol. */
export async function listDocuments(): Promise<KnowledgeDocument[]> {
  const res = await fetch(`${API_URL}/api/documents`, { headers: headers() });
  return parse<KnowledgeDocument[]>(res);
}

/** Sube un documento (multipart). Solo docentes. */
export async function uploadDocument(
  form: FormData,
): Promise<KnowledgeDocument> {
  const h: Record<string, string> = {};
  if (authToken) h.Authorization = `Bearer ${authToken}`;
  // No fijar Content-Type: el navegador añade el boundary del multipart.
  const res = await fetch(`${API_URL}/api/documents`, {
    method: "POST",
    headers: h,
    body: form,
  });
  return parse<KnowledgeDocument>(res);
}

/** Elimina un documento. Solo docentes. */
export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/documents/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  await parse<{ ok: boolean }>(res);
}

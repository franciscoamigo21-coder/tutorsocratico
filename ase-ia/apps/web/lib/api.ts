import type { ChatRequest, ChatResponse, SessionInfo } from "@ase-ia/shared";

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

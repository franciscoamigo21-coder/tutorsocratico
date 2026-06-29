import type { ChatRequest, ChatResponse } from "@ase-ia/shared";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Cliente del endpoint de chat de la API. */
export async function sendChat(payload: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error de red" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

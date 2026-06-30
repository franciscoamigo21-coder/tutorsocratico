import type { Request, Response } from "express";
import {
  NO_INFO_MESSAGE,
  OUT_OF_SCOPE_MESSAGE,
  type ChatRequest,
  type ChatResponse,
  type Role,
} from "@ase-ia/shared";
import { createAIProvider } from "../services/ai/AIProviderFactory.js";
import type { ChatTurn } from "../services/ai/AIProvider.js";
import { retrieve } from "../services/rag/retriever.js";
import { gatherWorkspaceCitations } from "../services/workspace/intent.js";
import {
  buildSystemPrompt,
  isOutOfScope,
  verifyGrounding,
} from "../services/guardrails/index.js";
import { record } from "../services/audit/index.js";

const provider = createAIProvider();

/** Cuántos turnos de historial se conservan (acota tokens). */
const MAX_HISTORY = 6;

/** Sanea el historial recibido del cliente: roles válidos y contenido acotado. */
function sanitizeHistory(raw: ChatRequest["history"]): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t) =>
        t &&
        (t.role === "user" || t.role === "assistant") &&
        typeof t.content === "string" &&
        t.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 2000) }));
}

/**
 * POST /api/chat — Orquesta una consulta con grounding obligatorio.
 * Flujo: scope → recuperar fuentes → redactar SOLO con fuentes (con historial)
 * → verificar anclaje estricto → auditar.
 */
export async function handleChat(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const { role, uid, schoolId } = user as {
    role: Role;
    uid: string;
    schoolId: string;
  };

  const body = req.body as ChatRequest;
  const message = (body?.message ?? "").toString().trim();
  const history = sanitizeHistory(body?.history);

  if (message.length < 2) {
    res.status(400).json({ error: "Mensaje vacío o demasiado corto" });
    return;
  }

  // Guardrail 1: ámbito escolar.
  if (isOutOfScope(message)) {
    record({
      uid, role, schoolId,
      consulta: message,
      resultado: "out_of_scope",
      fuentesCitadas: [],
      proveedorIA: provider.name,
    });
    res.json({
      reply: OUT_OF_SCOPE_MESSAGE,
      citations: [],
      resultado: "out_of_scope",
      proveedorIA: provider.name,
      confidence: "low",
    } satisfies ChatResponse);
    return;
  }

  // Recuperación de fuentes: documentos (RAG) + Google Workspace (tareas,
  // calendario, material). Se combinan y re-indexan para el grounding.
  const docCitations = await retrieve(message, role, schoolId);
  const wsCitations = await gatherWorkspaceCitations(message, role, uid);
  const citations = [...docCitations.map((c) => ({ ...c })), ...wsCitations].map(
    (c, i) => ({ ...c, index: i + 1 }),
  );

  // Guardrail 2: sin fuentes → NO se llama a la IA, se responde "no info".
  if (citations.length === 0) {
    record({
      uid, role, schoolId,
      consulta: message,
      resultado: "no_info",
      fuentesCitadas: [],
      proveedorIA: provider.name,
    });
    res.json({
      reply: NO_INFO_MESSAGE,
      citations: [],
      resultado: "no_info",
      proveedorIA: provider.name,
      confidence: "low",
    } satisfies ChatResponse);
    return;
  }

  // Redacción anclada a las fuentes (con historial conversacional).
  try {
    const result = await provider.generate({
      system: buildSystemPrompt(role),
      prompt: message,
      history,
      context: citations.map((c) => `${c.titulo}: ${c.fragmento}`),
    });

    // Guardrail 3: verificación de anclaje ESTRICTA.
    const check = verifyGrounding(result.text, citations.length);

    if (!check.grounded) {
      record({
        uid, role, schoolId,
        consulta: message,
        resultado: "no_info",
        fuentesCitadas: [],
        proveedorIA: result.provider,
      });
      console.warn(`[grounding] descartada: ${check.reason}`);
      res.json({
        reply: NO_INFO_MESSAGE,
        citations: [],
        resultado: "no_info",
        proveedorIA: result.provider,
        confidence: "low",
      } satisfies ChatResponse);
      return;
    }

    // Solo se devuelven las fuentes efectivamente citadas por el modelo.
    const usadas = citations.filter((c) => check.usedIndices.includes(c.index));

    record({
      uid, role, schoolId,
      consulta: message,
      resultado: "answered",
      fuentesCitadas: usadas.map((c) => c.docId),
      proveedorIA: result.provider,
    });

    res.json({
      reply: result.text,
      citations: usadas,
      resultado: "answered",
      proveedorIA: result.provider,
      confidence: "high",
    } satisfies ChatResponse);
  } catch (err) {
    record({
      uid, role, schoolId,
      consulta: message,
      resultado: "error",
      fuentesCitadas: [],
      proveedorIA: provider.name,
    });
    console.error("[chat] error:", (err as Error).message);
    res.status(502).json({
      error: "No se pudo generar la respuesta en este momento.",
    });
  }
}

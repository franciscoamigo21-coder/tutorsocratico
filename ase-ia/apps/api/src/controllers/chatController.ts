import type { Request, Response } from "express";
import {
  NO_INFO_MESSAGE,
  OUT_OF_SCOPE_MESSAGE,
  type ChatRequest,
  type ChatResponse,
  type Role,
} from "@ase-ia/shared";
import { createAIProvider } from "../services/ai/AIProviderFactory.js";
import { retrieve } from "../services/rag/retriever.js";
import {
  buildSystemPrompt,
  isOutOfScope,
  isGrounded,
} from "../services/guardrails/index.js";
import { record } from "../services/audit/index.js";

const provider = createAIProvider();

/**
 * POST /api/chat — Orquesta una consulta con grounding obligatorio.
 * Flujo: scope → recuperar fuentes → redactar SOLO con fuentes → verificar →
 * auditar.
 */
export async function handleChat(req: Request, res: Response): Promise<void> {
  // M1 reemplazará esto por el rol real del token verificado.
  const role: Role = (req.header("x-ase-role") as Role) || "student";
  const uid = req.header("x-ase-uid") || "anon";
  const schoolId = req.header("x-ase-school") || "jjp";

  const body = req.body as ChatRequest;
  const message = (body?.message ?? "").toString().trim();

  if (message.length < 2) {
    res.status(400).json({ error: "Mensaje vacío o demasiado corto" });
    return;
  }

  // Guardrail 1: ámbito escolar.
  if (isOutOfScope(message)) {
    record({
      uid,
      role,
      schoolId,
      consulta: message,
      resultado: "out_of_scope",
      fuentesCitadas: [],
      proveedorIA: provider.name,
    });
    const out: ChatResponse = {
      reply: OUT_OF_SCOPE_MESSAGE,
      citations: [],
      resultado: "out_of_scope",
      proveedorIA: provider.name,
    };
    res.json(out);
    return;
  }

  // Recuperación de fuentes autorizadas para el rol.
  const citations = await retrieve(message, role);

  // Guardrail 2: sin fuentes → NO se llama a la IA, se responde "no info".
  if (citations.length === 0) {
    record({
      uid,
      role,
      schoolId,
      consulta: message,
      resultado: "no_info",
      fuentesCitadas: [],
      proveedorIA: provider.name,
    });
    const out: ChatResponse = {
      reply: NO_INFO_MESSAGE,
      citations: [],
      resultado: "no_info",
      proveedorIA: provider.name,
    };
    res.json(out);
    return;
  }

  // Redacción anclada a las fuentes.
  try {
    const result = await provider.generate({
      system: buildSystemPrompt(role),
      prompt: message,
      context: citations.map((c) => `[${c.titulo}] ${c.fragmento}`),
    });

    const reply = isGrounded(true, result.text)
      ? result.text || NO_INFO_MESSAGE
      : NO_INFO_MESSAGE;

    record({
      uid,
      role,
      schoolId,
      consulta: message,
      resultado: "answered",
      fuentesCitadas: citations.map((c) => c.docId),
      proveedorIA: result.provider,
    });

    const out: ChatResponse = {
      reply,
      citations,
      resultado: "answered",
      proveedorIA: result.provider,
    };
    res.json(out);
  } catch (err) {
    record({
      uid,
      role,
      schoolId,
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

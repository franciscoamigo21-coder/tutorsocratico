import { createAIProvider } from "../ai/AIProviderFactory.js";

/**
 * Capa de embeddings para RAG. Aísla al resto del sistema de si el proveedor
 * activo soporta embeddings o no: si no los soporta (o fallan), devuelve null y
 * el retriever cae a recuperación léxica.
 */

const provider = createAIProvider();

let supported: boolean | null = null;

/** Calcula el embedding de un texto, o null si no hay soporte/falla. */
export async function embed(text: string): Promise<number[] | null> {
  if (supported === false) return null;
  if (typeof provider.embed !== "function") {
    supported = false;
    return null;
  }
  try {
    const v = await provider.embed(text);
    supported = Array.isArray(v) && v.length > 0;
    return supported ? v : null;
  } catch {
    supported = false;
    return null;
  }
}

/** Embeddings en lote (ingesta de documentos). */
export async function embedMany(texts: string[]): Promise<(number[] | null)[]> {
  return Promise.all(texts.map((t) => embed(t)));
}

/** Similitud coseno entre dos vectores de igual dimensión. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

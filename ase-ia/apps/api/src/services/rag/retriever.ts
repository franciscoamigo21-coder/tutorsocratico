import type { Citation, DocumentChunk, Role } from "@ase-ia/shared";
import { getDocumentStore } from "../documents/index.js";
import { embed, cosineSimilarity } from "./embeddings.js";

/**
 * Recuperador de la base de conocimiento (RAG).
 *
 * M5: búsqueda VECTORIAL por similitud coseno sobre los embeddings de los
 * chunks. Si no hay embeddings (proveedor sin soporte) o falla, cae a
 * recuperación LÉXICA por palabras clave. La interfaz pública (retrieve) no
 * cambia respecto de M4.
 */

/** Normaliza: minúsculas, sin acentos ni signos de puntuación. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lexicalScore(query: string, texto: string): number {
  const text = normalize(texto);
  const palabras = normalize(query)
    .split(" ")
    .filter((w) => w.length > 3);
  if (palabras.length === 0) return 0;
  return palabras.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
}

function toCitations(ranked: DocumentChunk[]): Citation[] {
  return ranked.map((c, i) => ({
    index: i + 1,
    docId: c.docId,
    titulo: c.metadata.titulo,
    fragmento: c.texto,
  }));
}

/** Devuelve los fragmentos más relevantes visibles para el rol del usuario. */
export async function retrieve(
  query: string,
  role: Role,
  schoolId: string,
  limit = 3,
): Promise<Citation[]> {
  const chunks = await getDocumentStore().getChunks(schoolId, role);
  if (chunks.length === 0) return [];

  // 1) Intento vectorial: requiere embedding de la consulta y de los chunks.
  const conEmbedding = chunks.filter(
    (c) => Array.isArray(c.embedding) && c.embedding.length > 0,
  );
  if (conEmbedding.length > 0) {
    const qVec = await embed(query);
    if (qVec) {
      const ranked = conEmbedding
        .map((c) => ({ c, s: cosineSimilarity(qVec, c.embedding!) }))
        .filter((r) => r.s > 0.1) // umbral mínimo de relevancia
        .sort((a, b) => b.s - a.s)
        .slice(0, limit)
        .map((r) => r.c);
      if (ranked.length > 0) return toCitations(ranked);
    }
  }

  // 2) Respaldo léxico.
  const ranked = chunks
    .map((c) => ({ c, s: lexicalScore(query, c.texto + " " + c.metadata.titulo) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.c);
  return toCitations(ranked);
}

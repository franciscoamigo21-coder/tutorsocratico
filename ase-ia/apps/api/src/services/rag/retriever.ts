import type { Citation, Role } from "@ase-ia/shared";
import { getDocumentStore } from "../documents/index.js";

/**
 * Recuperador de la base de conocimiento.
 *
 * M4: busca por palabras clave sobre los CHUNKS almacenados (documentos subidos
 * + base sembrada), filtrados por establecimiento y rol.
 * M5: se reemplaza la puntuación léxica por búsqueda vectorial (embeddings) SIN
 * cambiar esta interfaz pública (retrieve()).
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

function score(query: string, texto: string): number {
  const text = normalize(texto);
  const palabras = normalize(query)
    .split(" ")
    .filter((w) => w.length > 3);
  return palabras.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
}

/** Devuelve los fragmentos más relevantes visibles para el rol del usuario. */
export async function retrieve(
  query: string,
  role: Role,
  schoolId: string,
  limit = 3,
): Promise<Citation[]> {
  const chunks = await getDocumentStore().getChunks(schoolId, role);

  return chunks
    .map((c) => ({ chunk: c, s: score(query, c.texto + " " + c.metadata.titulo) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r, i) => ({
      index: i + 1,
      docId: r.chunk.docId,
      titulo: r.chunk.metadata.titulo,
      fragmento: r.chunk.texto,
    }));
}

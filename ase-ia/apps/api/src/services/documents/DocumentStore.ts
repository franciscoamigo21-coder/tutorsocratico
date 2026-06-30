import type {
  DocumentChunk,
  DocumentType,
  KnowledgeDocument,
  Role,
} from "@ase-ia/shared";
import { chunkText } from "./chunk.js";
import { embedMany } from "../rag/embeddings.js";

export interface AddDocumentInput {
  schoolId: string;
  titulo: string;
  tipo: DocumentType;
  texto: string;
  visibleParaRoles: Role[];
  url?: string;
}

/**
 * Contrato del almacén de la base de conocimiento. El retriever y las rutas
 * dependen de esta interfaz, no de la implementación (memoria o Firestore).
 */
export interface DocumentStore {
  addDocument(input: AddDocumentInput): Promise<KnowledgeDocument>;
  listDocuments(schoolId: string, role: Role): Promise<KnowledgeDocument[]>;
  /** Chunks visibles para el rol (insumo del retriever). */
  getChunks(schoolId: string, role: Role): Promise<DocumentChunk[]>;
  deleteDocument(schoolId: string, id: string): Promise<boolean>;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Construye documento + chunks (con embeddings, best-effort) a partir del texto. */
async function buildDoc(input: AddDocumentInput): Promise<{
  doc: KnowledgeDocument;
  chunks: DocumentChunk[];
}> {
  const docId = makeId("doc");
  const doc: KnowledgeDocument = {
    id: docId,
    schoolId: input.schoolId,
    titulo: input.titulo,
    tipo: input.tipo,
    url: input.url,
    visibleParaRoles: input.visibleParaRoles,
    status: "indexed",
    createdAt: new Date().toISOString(),
  };
  const textos = chunkText(input.texto);
  // Se embebe el título junto al fragmento para reforzar las palabras clave.
  const vectores = await embedMany(textos.map((t) => `${input.titulo}. ${t}`));
  const chunks: DocumentChunk[] = textos.map((texto, i) => ({
    id: makeId("chunk"),
    docId,
    texto,
    embedding: vectores[i] ?? undefined,
    metadata: { titulo: input.titulo, tipo: input.tipo, posicion: i },
  }));
  return { doc, chunks };
}

/** Implementación en memoria (desarrollo). Se siembra con documentos base. */
export class InMemoryDocumentStore implements DocumentStore {
  private docs = new Map<string, KnowledgeDocument>();
  private chunks: DocumentChunk[] = [];
  private visibility = new Map<string, Role[]>();

  async addDocument(input: AddDocumentInput): Promise<KnowledgeDocument> {
    const { doc, chunks } = await buildDoc(input);
    this.docs.set(doc.id, doc);
    this.chunks.push(...chunks);
    this.visibility.set(doc.id, input.visibleParaRoles);
    return doc;
  }

  async listDocuments(
    schoolId: string,
    role: Role,
  ): Promise<KnowledgeDocument[]> {
    return [...this.docs.values()].filter(
      (d) => d.schoolId === schoolId && d.visibleParaRoles.includes(role),
    );
  }

  async getChunks(schoolId: string, role: Role): Promise<DocumentChunk[]> {
    const visibles = new Set(
      [...this.docs.values()]
        .filter((d) => d.schoolId === schoolId && d.visibleParaRoles.includes(role))
        .map((d) => d.id),
    );
    return this.chunks.filter((c) => visibles.has(c.docId));
  }

  async deleteDocument(schoolId: string, id: string): Promise<boolean> {
    const doc = this.docs.get(id);
    if (!doc || doc.schoolId !== schoolId) return false;
    this.docs.delete(id);
    this.chunks = this.chunks.filter((c) => c.docId !== id);
    this.visibility.delete(id);
    return true;
  }
}

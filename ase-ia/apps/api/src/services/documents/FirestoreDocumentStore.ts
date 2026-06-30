import type {
  DocumentChunk,
  KnowledgeDocument,
  Role,
} from "@ase-ia/shared";
import { chunkText } from "./chunk.js";
import type { AddDocumentInput, DocumentStore } from "./DocumentStore.js";
import { config } from "../../config/index.js";

/**
 * Almacén en Firestore. Estructura:
 *   schools/{schoolId}/documents/{docId}
 *   schools/{schoolId}/chunks/{chunkId}   (campo docId enlaza al documento)
 *
 * firebase-admin se importa de forma diferida. Solo se usa cuando Firebase está
 * configurado; en desarrollo sin credenciales se usa InMemoryDocumentStore.
 */
export class FirestoreDocumentStore implements DocumentStore {
  private dbCache: any = null;

  private async db(): Promise<any> {
    if (this.dbCache) return this.dbCache;
    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");
    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert({
              projectId: config.firebase.projectId,
              clientEmail: config.firebase.clientEmail,
              privateKey: config.firebase.privateKey,
            }),
          });
    this.dbCache = getFirestore(app);
    return this.dbCache;
  }

  async addDocument(input: AddDocumentInput): Promise<KnowledgeDocument> {
    const db = await this.db();
    const docRef = db.collection(`schools/${input.schoolId}/documents`).doc();
    const doc: KnowledgeDocument = {
      id: docRef.id,
      schoolId: input.schoolId,
      titulo: input.titulo,
      tipo: input.tipo,
      url: input.url,
      visibleParaRoles: input.visibleParaRoles,
      status: "indexed",
      createdAt: new Date().toISOString(),
    };
    const batch = db.batch();
    batch.set(docRef, doc);
    chunkText(input.texto).forEach((texto, i) => {
      const cRef = db.collection(`schools/${input.schoolId}/chunks`).doc();
      const chunk: DocumentChunk = {
        id: cRef.id,
        docId: doc.id,
        texto,
        metadata: { titulo: input.titulo, tipo: input.tipo, posicion: i },
      };
      batch.set(cRef, chunk);
    });
    await batch.commit();
    return doc;
  }

  async listDocuments(
    schoolId: string,
    role: Role,
  ): Promise<KnowledgeDocument[]> {
    const db = await this.db();
    const snap = await db
      .collection(`schools/${schoolId}/documents`)
      .where("visibleParaRoles", "array-contains", role)
      .get();
    return snap.docs.map((d: any) => d.data() as KnowledgeDocument);
  }

  async getChunks(schoolId: string, role: Role): Promise<DocumentChunk[]> {
    const docs = await this.listDocuments(schoolId, role);
    const visibles = new Set(docs.map((d) => d.id));
    if (visibles.size === 0) return [];
    const db = await this.db();
    const snap = await db.collection(`schools/${schoolId}/chunks`).get();
    return snap.docs
      .map((d: any) => d.data() as DocumentChunk)
      .filter((c: DocumentChunk) => visibles.has(c.docId));
  }

  async deleteDocument(schoolId: string, id: string): Promise<boolean> {
    const db = await this.db();
    const docRef = db.collection(`schools/${schoolId}/documents`).doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return false;
    const chunks = await db
      .collection(`schools/${schoolId}/chunks`)
      .where("docId", "==", id)
      .get();
    const batch = db.batch();
    chunks.docs.forEach((c: any) => batch.delete(c.ref));
    batch.delete(docRef);
    await batch.commit();
    return true;
  }
}

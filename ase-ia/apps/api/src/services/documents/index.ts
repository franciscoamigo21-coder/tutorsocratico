import type { Role } from "@ase-ia/shared";
import { isAuthConfigured } from "../auth/firebaseAdmin.js";
import { InMemoryDocumentStore, type DocumentStore } from "./DocumentStore.js";
import { FirestoreDocumentStore } from "./FirestoreDocumentStore.js";

const ALL: Role[] = ["student", "teacher", "guardian"];

/** Documentos base para que el asistente funcione recién instalado. */
const SEED = [
  {
    titulo: "Reglamento Interno · Atrasos",
    tipo: "reglamento_interno" as const,
    texto:
      "El estudiante que llegue después del horario de inicio debe registrar " +
      "su atraso en inspectoría. Tres atrasos en el mes implican citación al " +
      "apoderado.",
    visibleParaRoles: ALL,
  },
  {
    titulo: "Calendario Académico 2026",
    tipo: "calendario" as const,
    texto:
      "El primer semestre finaliza la primera semana de julio. Las vacaciones " +
      "de invierno comienzan a mediados de julio.",
    visibleParaRoles: ALL,
  },
  {
    titulo: "Protocolo de Justificación de Ausencias",
    tipo: "protocolo" as const,
    texto:
      "Las ausencias se justifican mediante comunicación escrita del apoderado " +
      "dirigida al profesor jefe, dentro de las 48 horas siguientes.",
    visibleParaRoles: ALL,
  },
];

let store: DocumentStore;

export function getDocumentStore(): DocumentStore {
  if (!store) {
    store = isAuthConfigured()
      ? new FirestoreDocumentStore()
      : new InMemoryDocumentStore();
  }
  return store;
}

/**
 * Siembra los documentos base. En memoria siempre; en Firestore solo si está
 * vacío se haría desde un script de administración (no aquí, para no duplicar).
 */
export async function seedDefaultDocuments(schoolId = "jjp"): Promise<void> {
  if (isAuthConfigured()) return; // Firestore se siembra aparte (script M7).
  const s = getDocumentStore();
  for (const d of SEED) {
    await s.addDocument({ schoolId, ...d });
  }
  console.log(`[docs] base de conocimiento sembrada (${SEED.length} documentos)`);
}

export type { DocumentStore } from "./DocumentStore.js";

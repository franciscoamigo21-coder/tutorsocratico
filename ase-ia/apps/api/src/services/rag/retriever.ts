import type { Citation, Role } from "@ase-ia/shared";

/**
 * Recuperador de la base de conocimiento.
 *
 * M0/M3: implementación por palabras clave sobre una base SEMILLA en memoria,
 * suficiente para validar el flujo de grounding.
 * M5: se reemplaza por búsqueda vectorial (embeddings) SIN cambiar esta
 * interfaz pública (retrieve()).
 */

interface SeedDoc {
  docId: string;
  titulo: string;
  texto: string;
  visibleParaRoles: Role[];
}

const SEED: SeedDoc[] = [
  {
    docId: "reglamento-atrasos",
    titulo: "Reglamento Interno · Atrasos",
    texto:
      "El estudiante que llegue después del horario de inicio debe registrar " +
      "su atraso en inspectoría. Tres atrasos en el mes implican citación al " +
      "apoderado.",
    visibleParaRoles: ["student", "teacher", "guardian"],
  },
  {
    docId: "calendario-academico",
    titulo: "Calendario Académico 2026",
    texto:
      "El primer semestre finaliza la primera semana de julio. Las vacaciones " +
      "de invierno comienzan a mediados de julio.",
    visibleParaRoles: ["student", "teacher", "guardian"],
  },
  {
    docId: "protocolo-ausencias",
    titulo: "Protocolo de Justificación de Ausencias",
    texto:
      "Las ausencias se justifican mediante comunicación escrita del apoderado " +
      "dirigida al profesor jefe, dentro de las 48 horas siguientes.",
    visibleParaRoles: ["student", "teacher", "guardian"],
  },
];

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
  limit = 3,
): Promise<Citation[]> {
  return SEED.filter((d) => d.visibleParaRoles.includes(role))
    .map((d) => ({ doc: d, s: score(query, d.texto + " " + d.titulo) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r, i) => ({
      index: i + 1,
      docId: r.doc.docId,
      titulo: r.doc.titulo,
      fragmento: r.doc.texto,
    }));
}

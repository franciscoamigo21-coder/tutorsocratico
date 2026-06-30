import type { Citation, Role } from "@ase-ia/shared";
import { classroom, calendar, drive } from "./index.js";

/**
 * Convierte datos de Google Workspace en fuentes citables, para que el
 * orquestador los trate igual que los documentos (grounding uniforme).
 * Detecta la intención de la consulta por palabras clave y consulta solo el
 * servicio pertinente.
 */

function has(text: string, words: string[]): boolean {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w));
}

/** Devuelve fuentes de Workspace relevantes a la consulta (vacío si no aplica). */
export async function gatherWorkspaceCitations(
  query: string,
  role: Role,
  uid: string,
): Promise<Omit<Citation, "index">[]> {
  const out: Omit<Citation, "index">[] = [];

  // Tareas / pendientes → Classroom (estudiantes y docentes).
  if (
    (role === "student" || role === "teacher") &&
    has(query, ["tarea", "pendiente", "entrega", "deber"])
  ) {
    const tareas = await classroom.listAssignments(uid);
    if (tareas.length) {
      out.push({
        docId: "ws_classroom",
        titulo: "Google Classroom · Tareas",
        fragmento: tareas
          .map((t) => `${t.curso}: ${t.titulo} (vence ${t.vence})`)
          .join(". "),
      });
    }
  }

  // Fechas / evaluaciones / calendario → Calendar.
  if (has(query, ["fecha", "evaluacion", "evaluación", "prueba", "calendario", "reunion", "reunión", "cuando", "cuándo"])) {
    const eventos = await calendar.upcomingEvents(uid);
    if (eventos.length) {
      out.push({
        docId: "ws_calendar",
        titulo: "Google Calendar · Próximos eventos",
        fragmento: eventos.map((e) => `${e.titulo} (${e.fecha})`).join(". "),
      });
    }
  }

  // Material / dónde está → Drive.
  if (has(query, ["material", "donde", "dónde", "archivo", "documento", "guia", "guía", "presentacion", "presentación"])) {
    const files = await drive.searchFiles(uid, query);
    if (files.length) {
      out.push({
        docId: "ws_drive",
        titulo: "Google Drive · Material",
        fragmento: files.map((f) => `${f.nombre} → ${f.url}`).join(". "),
      });
    }
  }

  return out;
}

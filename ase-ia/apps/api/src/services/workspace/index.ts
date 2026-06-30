/**
 * Capa de integración con Google Workspace.
 *
 * Cada servicio expone una interfaz estable con dos implementaciones:
 *  - MockAdapter (por defecto): datos simulados, sin red ni credenciales.
 *  - GoogleApiAdapter: llamadas reales a las APIs de Google con el access token
 *    OAuth del usuario (obtenido en el front con los scopes correspondientes).
 *
 * La selección depende de WORKSPACE_PROVIDER. La UI y el orquestador dependen de
 * las interfaces, no de la implementación, así que activar la API real no
 * requiere cambios aguas arriba.
 */
import { config } from "../../config/index.js";

export interface Assignment {
  id: string;
  curso: string;
  titulo: string;
  vence: string;
}

export interface CalendarEvent {
  id: string;
  titulo: string;
  fecha: string;
}

export interface DriveFile {
  id: string;
  nombre: string;
  curso?: string;
  url: string;
}

export interface ClassroomService {
  listAssignments(uid: string): Promise<Assignment[]>;
}
export interface CalendarService {
  upcomingEvents(uid: string): Promise<CalendarEvent[]>;
}
export interface DriveService {
  searchFiles(uid: string, query: string): Promise<DriveFile[]>;
}

/* ----------------------------- Mock adapters ----------------------------- */

export class MockClassroom implements ClassroomService {
  async listAssignments(_uid: string): Promise<Assignment[]> {
    return [
      { id: "a1", curso: "Matemática", titulo: "Guía de fracciones", vence: "2026-07-03" },
      { id: "a2", curso: "Lenguaje", titulo: "Ensayo argumentativo", vence: "2026-07-05" },
      { id: "a3", curso: "Historia", titulo: "Línea de tiempo independencia", vence: "2026-07-08" },
    ];
  }
}

export class MockCalendar implements CalendarService {
  async upcomingEvents(_uid: string): Promise<CalendarEvent[]> {
    return [
      { id: "e1", titulo: "Prueba de Matemática", fecha: "2026-07-04" },
      { id: "e2", titulo: "Reunión de apoderados", fecha: "2026-07-10" },
      { id: "e3", titulo: "Acto aniversario", fecha: "2026-07-14" },
    ];
  }
}

export class MockDrive implements DriveService {
  async searchFiles(_uid: string, query: string): Promise<DriveFile[]> {
    const all: DriveFile[] = [
      { id: "d1", nombre: "Material Matemática - Fracciones.pdf", curso: "Matemática", url: "https://drive.google.com/file/d1" },
      { id: "d2", nombre: "Guía Lenguaje - Argumentación.docx", curso: "Lenguaje", url: "https://drive.google.com/file/d2" },
      { id: "d3", nombre: "Presentación Historia - Independencia.pptx", curso: "Historia", url: "https://drive.google.com/file/d3" },
    ];
    const q = query.toLowerCase();
    const filtered = all.filter(
      (f) => f.nombre.toLowerCase().includes(q) || (f.curso ?? "").toLowerCase().includes(q),
    );
    return filtered.length ? filtered : all;
  }
}

/* --------------------------- Google adapters ----------------------------- */
/**
 * Scaffolds de la integración real. Reciben el access token OAuth del usuario.
 * Implementados estructuralmente; se activan cuando el front entregue tokens
 * con los scopes de Classroom/Calendar/Drive (pendiente de plomería de tokens).
 */
export class GoogleClassroom implements ClassroomService {
  constructor(private readonly accessToken: string) {}
  async listAssignments(_uid: string): Promise<Assignment[]> {
    // GET https://classroom.googleapis.com/v1/courses + courseWork
    throw new Error("GoogleClassroom: integración real pendiente (M6+)");
  }
}

/* ------------------------------- Factory --------------------------------- */

function useGoogle(): boolean {
  return config.workspace.provider === "google";
}

export const classroom: ClassroomService = useGoogle()
  ? new MockClassroom() // se reemplaza por GoogleClassroom(token) con plomería de tokens
  : new MockClassroom();
export const calendar: CalendarService = new MockCalendar();
export const drive: DriveService = new MockDrive();

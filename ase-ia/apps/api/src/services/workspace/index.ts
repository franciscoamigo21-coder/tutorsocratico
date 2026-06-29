/**
 * Capa de integración con Google Workspace.
 *
 * Cada servicio expone una interfaz estable con dos implementaciones:
 *  - MockAdapter (actual): datos simulados, sin red ni credenciales.
 *  - GoogleApiAdapter (M6): llamadas reales a las APIs de Google.
 *
 * La UI y el orquestador dependen de la interfaz, no de la implementación, así
 * que conectar la API real no requiere cambios aguas arriba.
 */

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

export interface ClassroomService {
  listAssignments(uid: string): Promise<Assignment[]>;
}

export interface CalendarService {
  upcomingEvents(uid: string): Promise<CalendarEvent[]>;
}

/** Implementación simulada (M0). */
export class MockClassroom implements ClassroomService {
  async listAssignments(_uid: string): Promise<Assignment[]> {
    return [
      { id: "a1", curso: "Matemática", titulo: "Guía de fracciones", vence: "2026-07-03" },
      { id: "a2", curso: "Lenguaje", titulo: "Ensayo argumentativo", vence: "2026-07-05" },
    ];
  }
}

export class MockCalendar implements CalendarService {
  async upcomingEvents(_uid: string): Promise<CalendarEvent[]> {
    return [
      { id: "e1", titulo: "Prueba de Matemática", fecha: "2026-07-04" },
      { id: "e2", titulo: "Reunión de apoderados", fecha: "2026-07-10" },
    ];
  }
}

export const classroom: ClassroomService = new MockClassroom();
export const calendar: CalendarService = new MockCalendar();

import type { AuditLog } from "@ase-ia/shared";

/**
 * Registro de auditoría. M0: a consola/memoria. M8: se persiste en Firestore
 * (colección audit_logs) sin cambiar esta interfaz.
 */
const memoryLog: AuditLog[] = [];

export function record(entry: Omit<AuditLog, "id" | "timestamp">): AuditLog {
  const log: AuditLog = {
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  memoryLog.push(log);
  console.log(
    `[audit] ${log.role} · ${log.resultado} · fuentes=${log.fuentesCitadas.length}` +
      ` · ${log.proveedorIA} · "${log.consulta.slice(0, 60)}"`,
  );
  return log;
}

export function recentLogs(limit = 50): AuditLog[] {
  return memoryLog.slice(-limit).reverse();
}

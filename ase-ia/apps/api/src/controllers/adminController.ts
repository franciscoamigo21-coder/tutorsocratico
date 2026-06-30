import type { Request, Response } from "express";
import { ROLES, type Role } from "@ase-ia/shared";
import { isAuthConfigured, setRoleByEmail } from "../services/auth/firebaseAdmin.js";
import { recentLogs } from "../services/audit/index.js";

/** GET /api/admin/logs — registros de auditoría (solo docentes/admin). */
export function getLogs(req: Request, res: Response): void {
  const limit = Math.min(Number(req.query.limit ?? 100) || 100, 500);
  res.json(recentLogs(limit));
}

/**
 * POST /api/admin/roles — asigna un rol a un usuario por correo.
 * Requiere Firebase configurado (custom claims).
 */
export async function assignRole(req: Request, res: Response): Promise<void> {
  const email = (req.body?.email ?? "").toString().trim();
  const role = (req.body?.role ?? "").toString() as Role;
  const schoolId = (req.body?.schoolId ?? req.user!.schoolId).toString();

  if (!email || !ROLES.includes(role)) {
    res.status(400).json({ error: "Correo o rol inválido" });
    return;
  }
  if (!isAuthConfigured()) {
    res.status(501).json({
      error:
        "Gestión de roles no disponible: Firebase Auth no está configurado. " +
        "En desarrollo, usa cabeceras x-ase-role para simular roles.",
    });
    return;
  }

  try {
    await setRoleByEmail(email, role, schoolId);
    res.json({ ok: true, email, role, schoolId });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

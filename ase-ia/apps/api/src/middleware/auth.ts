import type { NextFunction, Request, Response } from "express";
import { ROLES, type Role, type SessionInfo } from "@ase-ia/shared";
import { config } from "../config/index.js";
import { isAuthConfigured, verifyIdToken } from "../services/auth/firebaseAdmin.js";

/** Extiende Express.Request con el usuario autenticado. */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionInfo;
    }
  }
}

let warnedFallback = false;

/** Construye un usuario de desarrollo a partir de cabeceras x-ase-*. */
function devUser(req: Request): SessionInfo {
  const headerRole = (req.header("x-ase-role") as Role) || "student";
  const role: Role = ROLES.includes(headerRole) ? headerRole : "student";
  return {
    uid: req.header("x-ase-uid") || "dev-user",
    email: req.header("x-ase-email") || "dev@local",
    displayName: req.header("x-ase-name") || "Usuario Dev",
    role,
    schoolId: req.header("x-ase-school") || "jjp",
  };
}

/**
 * Autenticación. Si Firebase está configurado, exige un ID token válido en
 * `Authorization: Bearer <token>` y lee el rol de los custom claims. Si NO está
 * configurado y estamos en desarrollo, cae al modo de cabeceras (inseguro, solo
 * local). En producción sin Firebase, rechaza.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (isAuthConfigured()) {
    const header = req.header("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      res.status(401).json({ error: "Falta el token de autenticación" });
      return;
    }
    try {
      const decoded = await verifyIdToken(token);
      if (!decoded) {
        res.status(401).json({ error: "No se pudo verificar el token" });
        return;
      }
      if (!decoded.role || !ROLES.includes(decoded.role)) {
        res.status(403).json({
          error:
            "Tu cuenta no tiene un rol asignado en el establecimiento. " +
            "Contacta al administrador.",
        });
        return;
      }
      req.user = {
        uid: decoded.uid,
        email: decoded.email ?? "",
        displayName: decoded.name ?? "",
        role: decoded.role,
        schoolId: decoded.schoolId ?? "default",
      };
      next();
      return;
    } catch {
      res.status(401).json({ error: "Token inválido o expirado" });
      return;
    }
  }

  if (config.devAuthFallback) {
    if (!warnedFallback) {
      console.warn(
        "[auth] Firebase no configurado: usando fallback de desarrollo " +
          "(cabeceras x-ase-*). NO usar en producción.",
      );
      warnedFallback = true;
    }
    req.user = devUser(req);
    next();
    return;
  }

  res.status(401).json({ error: "Autenticación no disponible" });
}

/** Restringe una ruta a uno o más roles. Debe ir después de authenticate. */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "No tienes permiso para esta acción" });
      return;
    }
    next();
  };
}

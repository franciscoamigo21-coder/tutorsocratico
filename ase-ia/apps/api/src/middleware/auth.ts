import type { NextFunction, Request, Response } from "express";

/**
 * Stub de autenticación (M0). En M1 se reemplaza por la verificación del token
 * de Firebase Auth y la lectura de custom claims (role, schoolId).
 *
 * Por ahora confía en cabeceras x-ase-* para poder probar los roles en local.
 * Esto NO es seguro y se elimina en M1.
 */
export function authStub(req: Request, _res: Response, next: NextFunction): void {
  req.headers["x-ase-uid"] ??= "dev-user";
  req.headers["x-ase-role"] ??= "student";
  req.headers["x-ase-school"] ??= "jjp";
  next();
}

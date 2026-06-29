import type { NextFunction, Request, Response } from "express";

/** Manejador de errores central: registra y responde en formato ApiError. */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("[error]", err.message);
  res.status(500).json({ error: "Error interno del servidor" });
}

/** 404 uniforme. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Recurso no encontrado" });
}

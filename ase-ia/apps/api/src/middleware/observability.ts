import type { NextFunction, Request, Response } from "express";
import { recordRequest } from "../services/metrics/index.js";

/**
 * Logger de peticiones y registro de métricas. Mide latencia y registra el
 * estado por petición (línea estructurada, fácil de parsear en producción).
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    recordRequest(res.statusCode);
    console.log(
      JSON.stringify({
        t: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms,
      }),
    );
  });
  next();
}

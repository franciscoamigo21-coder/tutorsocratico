import { Router } from "express";
import multer from "multer";
import type { HealthResponse } from "@ase-ia/shared";
import { config, VERSION } from "../config/index.js";
import { createAIProvider } from "../services/ai/AIProviderFactory.js";
import { handleChat } from "../controllers/chatController.js";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
} from "../controllers/documentsController.js";
import { getLogs, assignRole } from "../controllers/adminController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { isAuthConfigured } from "../services/auth/firebaseAdmin.js";
import { classroom, calendar, drive } from "../services/workspace/index.js";
import { recentLogs } from "../services/audit/index.js";
import { snapshot } from "../services/metrics/index.js";

const router = Router();
const provider = createAIProvider();

// Subida en memoria, límite 10 MB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/** GET /api/health — estado del servicio, proveedor de IA y autenticación. */
router.get("/health", (_req, res) => {
  const body: HealthResponse = {
    ok: true,
    service: "ase-ia-api",
    version: VERSION,
    aiProvider: provider.name,
    aiConfigured: provider.isConfigured(),
    authConfigured: isAuthConfigured(),
  };
  res.json(body);
});

/** GET /api/metrics — métricas operacionales (uptime, requests, resultados). */
router.get("/metrics", (_req, res) => {
  res.json(snapshot());
});

/** GET /api/auth/session — devuelve el usuario autenticado (rol incluido). */
router.get("/auth/session", authenticate, (req, res) => {
  res.json(req.user);
});

/** POST /api/chat — consulta principal con grounding (requiere sesión). */
router.post("/chat", authenticate, handleChat);

/** Base de conocimiento. */
router.get("/documents", authenticate, listDocuments);
router.post(
  "/documents",
  authenticate,
  requireRole("teacher"),
  upload.single("file"),
  uploadDocument,
);
router.delete(
  "/documents/:id",
  authenticate,
  requireRole("teacher"),
  deleteDocument,
);

/** Workspace (simulado en M0/M1). */
router.get("/workspace/assignments", authenticate, async (req, res) => {
  res.json(await classroom.listAssignments(req.user!.uid));
});
router.get("/workspace/calendar", authenticate, async (req, res) => {
  res.json(await calendar.upcomingEvents(req.user!.uid));
});
router.get("/workspace/drive", authenticate, async (req, res) => {
  const q = (req.query.q ?? "").toString();
  res.json(await drive.searchFiles(req.user!.uid, q));
});

/** Auditoría: solo docentes. */
router.get("/audit", authenticate, requireRole("teacher"), (_req, res) => {
  res.json(recentLogs());
});

/** Panel de administración (solo docentes). */
router.get("/admin/logs", authenticate, requireRole("teacher"), getLogs);
router.post("/admin/roles", authenticate, requireRole("teacher"), assignRole);

export { router, config };

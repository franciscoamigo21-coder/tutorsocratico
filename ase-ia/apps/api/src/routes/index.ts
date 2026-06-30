import { Router } from "express";
import type { HealthResponse } from "@ase-ia/shared";
import { config, VERSION } from "../config/index.js";
import { createAIProvider } from "../services/ai/AIProviderFactory.js";
import { handleChat } from "../controllers/chatController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { isAuthConfigured } from "../services/auth/firebaseAdmin.js";
import { classroom, calendar } from "../services/workspace/index.js";
import { recentLogs } from "../services/audit/index.js";

const router = Router();
const provider = createAIProvider();

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

/** GET /api/auth/session — devuelve el usuario autenticado (rol incluido). */
router.get("/auth/session", authenticate, (req, res) => {
  res.json(req.user);
});

/** POST /api/chat — consulta principal con grounding (requiere sesión). */
router.post("/chat", authenticate, handleChat);

/** Workspace (simulado en M0/M1). */
router.get("/workspace/assignments", authenticate, async (req, res) => {
  res.json(await classroom.listAssignments(req.user!.uid));
});
router.get("/workspace/calendar", authenticate, async (req, res) => {
  res.json(await calendar.upcomingEvents(req.user!.uid));
});

/** Auditoría: solo docentes (en M7 pasará a rol admin). */
router.get("/audit", authenticate, requireRole("teacher"), (_req, res) => {
  res.json(recentLogs());
});

export { router, config };

import { Router } from "express";
import type { HealthResponse } from "@ase-ia/shared";
import { config, VERSION } from "../config/index.js";
import { createAIProvider } from "../services/ai/AIProviderFactory.js";
import { handleChat } from "../controllers/chatController.js";
import { authStub } from "../middleware/auth.js";
import { classroom, calendar } from "../services/workspace/index.js";
import { recentLogs } from "../services/audit/index.js";

const router = Router();
const provider = createAIProvider();

/** GET /api/health — estado del servicio y proveedor de IA. */
router.get("/health", (_req, res) => {
  const body: HealthResponse = {
    ok: true,
    service: "ase-ia-api",
    version: VERSION,
    aiProvider: provider.name,
    aiConfigured: provider.isConfigured(),
  };
  res.json(body);
});

/** POST /api/chat — consulta principal con grounding. */
router.post("/chat", authStub, handleChat);

/** Workspace (simulado en M0). */
router.get("/workspace/assignments", authStub, async (req, res) => {
  res.json(await classroom.listAssignments(req.header("x-ase-uid") || "anon"));
});
router.get("/workspace/calendar", authStub, async (req, res) => {
  res.json(await calendar.upcomingEvents(req.header("x-ase-uid") || "anon"));
});

/** Auditoría (lectura básica; en M7 se protege por rol admin). */
router.get("/audit", (_req, res) => {
  res.json(recentLogs());
});

export { router, config };

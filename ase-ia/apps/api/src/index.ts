import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config, VERSION } from "./config/index.js";
import { router } from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/observability.js";
import { seedDefaultDocuments } from "./services/documents/index.js";

const app = express();

// Detrás de un proxy (Cloud Run / Firebase) para rate-limit por IP real.
app.set("trust proxy", 1);

// Hardening de cabeceras HTTP.
app.use(helmet());

app.use(
  cors({
    origin(origin, cb) {
      // Permite peticiones sin origin (curl, health checks) y orígenes listados.
      if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`Origen no autorizado: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

// Límite general y límite específico (más estricto) para el chat.
app.use("/api", rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));
app.use(
  "/api/chat",
  rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }),
);

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, async () => {
  await seedDefaultDocuments();
  console.log(
    `\n  ASE-IA API v${VERSION}\n` +
      `  → http://localhost:${config.port}/api/health\n` +
      `  → Proveedor IA: ${config.ai.provider}\n` +
      `  → Entorno: ${config.env}\n`,
  );
});

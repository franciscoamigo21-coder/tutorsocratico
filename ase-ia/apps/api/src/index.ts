import express from "express";
import cors from "cors";
import { config, VERSION } from "./config/index.js";
import { router } from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

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

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(
    `\n  ASE-IA API v${VERSION}\n` +
      `  → http://localhost:${config.port}/api/health\n` +
      `  → Proveedor IA: ${config.ai.provider}\n` +
      `  → Entorno: ${config.env}\n`,
  );
});

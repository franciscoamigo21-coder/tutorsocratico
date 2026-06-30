/** Configuración central del servidor, leída desde variables de entorno. */
import "dotenv/config";

export type AiProviderName = "gemini" | "openai" | "anthropic" | "mock";

function parseOrigins(value: string | undefined): string[] {
  if (!value) return ["http://localhost:3000"];
  return value
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

const env = process.env.NODE_ENV ?? "development";

export const config = {
  env,
  // Cloud Run inyecta PORT; en local usamos API_PORT.
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),

  ai: {
    provider: (process.env.AI_PROVIDER ?? "mock") as AiProviderName,
    model: process.env.AI_MODEL ?? "",
    geminiKey: process.env.GEMINI_API_KEY ?? "",
    openaiKey: process.env.OPENAI_API_KEY ?? "",
    anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    // La clave privada suele venir con \n escapados en una sola línea.
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  },

  workspace: {
    // mock | google
    provider: (process.env.WORKSPACE_PROVIDER ?? "mock") as "mock" | "google",
  },

  /**
   * En desarrollo, si Firebase no está configurado, se permite un fallback que
   * confía en cabeceras x-ase-* para poder probar roles sin credenciales.
   * NUNCA se activa en producción.
   */
  devAuthFallback: env !== "production",
} as const;

export const VERSION = "0.1.0";

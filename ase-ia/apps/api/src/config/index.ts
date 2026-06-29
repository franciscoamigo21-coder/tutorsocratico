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

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.API_PORT ?? 4000),
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),

  ai: {
    provider: (process.env.AI_PROVIDER ?? "mock") as AiProviderName,
    model: process.env.AI_MODEL ?? "",
    geminiKey: process.env.GEMINI_API_KEY ?? "",
    openaiKey: process.env.OPENAI_API_KEY ?? "",
    anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  },
} as const;

export const VERSION = "0.1.0";

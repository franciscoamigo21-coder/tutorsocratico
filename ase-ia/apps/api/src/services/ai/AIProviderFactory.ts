import { config } from "../../config/index.js";
import type { AIProvider } from "./AIProvider.js";
import { MockProvider } from "./MockProvider.js";
import { LocalProvider } from "./LocalProvider.js";
import { GeminiProvider } from "./GeminiProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";
import { AnthropicProvider } from "./AnthropicProvider.js";

/**
 * Selecciona el proveedor de IA según AI_PROVIDER. Si el proveedor elegido no
 * tiene clave configurada, cae a "mock" para no romper el flujo en desarrollo.
 */
export function createAIProvider(): AIProvider {
  const { provider, model, geminiKey, openaiKey, anthropicKey } = config.ai;

  let candidate: AIProvider;
  switch (provider) {
    case "gemini":
      candidate = new GeminiProvider(geminiKey, model);
      break;
    case "openai":
      candidate = new OpenAIProvider(openaiKey, model);
      break;
    case "anthropic":
      candidate = new AnthropicProvider(anthropicKey, model);
      break;
    case "local":
      return new LocalProvider();
    case "mock":
    default:
      return new MockProvider();
  }

  if (!candidate.isConfigured()) {
    console.warn(
      `[ai] Proveedor "${provider}" sin clave configurada. Usando "mock".`,
    );
    return new MockProvider();
  }
  return candidate;
}

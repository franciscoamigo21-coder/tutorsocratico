import type { AIProvider, GenerateInput, GenerateResult } from "./AIProvider.js";

/**
 * Proveedor de desarrollo. No llama a ninguna API externa: redacta una
 * respuesta determinista a partir del contexto recuperado. Permite probar
 * todo el flujo (guardrails, RAG, auditoría) sin claves ni costo.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock";

  isConfigured(): boolean {
    return true;
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const fuentes = input.context.length
      ? input.context.map((c, i) => `(${i + 1}) ${c}`).join("\n")
      : "";

    const text = fuentes
      ? `Según la información del establecimiento:\n\n${fuentes}\n\n` +
        `(Respuesta simulada por el proveedor "mock". Conecta Gemini, ` +
        `OpenAI o Anthropic para respuestas reales.)`
      : "";

    return { text, provider: this.name };
  }
}

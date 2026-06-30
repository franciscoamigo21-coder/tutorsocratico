import type { AIProvider, GenerateInput, GenerateResult } from "./AIProvider.js";

/**
 * Adapter de Anthropic (Claude). Reutiliza el mismo enfoque ya validado en el
 * Cloudflare Worker del Tutor Socrático, ahora dentro de la abstracción común.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private readonly model: string;

  constructor(private readonly apiKey: string, model?: string) {
    this.model = model || "claude-sonnet-4-6";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    if (!this.isConfigured()) {
      throw new Error("AnthropicProvider: falta ANTHROPIC_API_KEY");
    }

    const userText =
      `${input.prompt}\n\n` +
      (input.context.length
        ? `FUENTES AUTORIZADAS (cita cada una inline como [n]):\n` +
          input.context.map((c, i) => `[${i + 1}] ${c}`).join("\n")
        : "No hay fuentes disponibles.");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: input.maxTokens ?? 1024,
        system: input.system,
        messages: [
          ...(input.history ?? []),
          { role: "user", content: userText },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Anthropic ${res.status}: ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as any;
    const block = (data?.content ?? []).find((b: any) => b.type === "text");
    return { text: (block?.text ?? "").trim(), provider: this.name };
  }

  /**
   * Anthropic no ofrece un endpoint de embeddings nativo. Se lanza error a
   * propósito: el servicio de RAG lo detecta y cae a recuperación léxica.
   */
  async embed(_text: string): Promise<number[]> {
    throw new Error("AnthropicProvider: embeddings no soportados");
  }
}

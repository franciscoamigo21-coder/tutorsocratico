import type { AIProvider, GenerateInput, GenerateResult } from "./AIProvider.js";

/** Adapter de OpenAI (Chat Completions). Intercambiable con los demás. */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private readonly model: string;

  constructor(private readonly apiKey: string, model?: string) {
    this.model = model || "gpt-4o-mini";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    if (!this.isConfigured()) {
      throw new Error("OpenAIProvider: falta OPENAI_API_KEY");
    }

    const userText =
      `${input.prompt}\n\n` +
      (input.context.length
        ? `FUENTES AUTORIZADAS (cita cada una inline como [n]):\n` +
          input.context.map((c, i) => `[${i + 1}] ${c}`).join("\n")
        : "No hay fuentes disponibles.");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: input.maxTokens ?? 1024,
        messages: [
          { role: "system", content: input.system },
          ...(input.history ?? []),
          { role: "user", content: userText },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as any;
    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return { text, provider: this.name };
  }
}

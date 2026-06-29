import type { AIProvider, GenerateInput, GenerateResult } from "./AIProvider.js";

/**
 * Adapter de Google Gemini. Coherente con el ecosistema Google Workspace del
 * colegio. Usa la REST API directa para evitar dependencias pesadas; se puede
 * migrar al SDK oficial sin cambiar la interfaz pública.
 */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private readonly model: string;

  constructor(private readonly apiKey: string, model?: string) {
    this.model = model || "gemini-1.5-flash";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    if (!this.isConfigured()) {
      throw new Error("GeminiProvider: falta GEMINI_API_KEY");
    }

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${this.model}:generateContent?key=${this.apiKey}`;

    const userText =
      `${input.prompt}\n\n` +
      (input.context.length
        ? `FUENTES AUTORIZADAS:\n${input.context.join("\n---\n")}`
        : "No hay fuentes disponibles.");

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: { maxOutputTokens: input.maxTokens ?? 1024 },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as any;
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    return { text, provider: this.name };
  }
}

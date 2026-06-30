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
    if (input.context.length === 0) {
      // Sin fuentes no se redacta nada: el verificador lo convertirá en NO_INFO.
      return { text: "", provider: this.name };
    }

    // Cita inline cada fuente con su marcador [n], como se exige a los
    // proveedores reales, para poder verificar el anclaje.
    const fuentes = input.context
      .map((c, i) => `[${i + 1}] ${c}`)
      .join("\n");

    const continuidad = input.history?.length
      ? `(Continuando la conversación.) `
      : "";

    const text =
      `${continuidad}Según la información del establecimiento:\n\n${fuentes}\n\n` +
      `(Respuesta simulada por el proveedor "mock". Conecta Gemini, ` +
      `OpenAI o Anthropic para respuestas reales.)`;

    return { text, provider: this.name };
  }

  /**
   * Embedding determinista (bolsa de palabras con hashing) para desarrollo: no
   * llama a ninguna API y produce vectores comparables por similitud coseno,
   * suficientes para validar el pipeline de RAG sin claves ni costo.
   */
  async embed(text: string): Promise<number[]> {
    const D = 64;
    const v = new Array<number>(D).fill(0);
    const tokens = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);
    for (const tok of tokens) {
      let h = 0;
      for (let i = 0; i < tok.length; i++) h = (h * 31 + tok.charCodeAt(i)) >>> 0;
      v[h % D] += 1;
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map((x) => x / norm);
  }
}

import type { AIProvider, GenerateInput, GenerateResult } from "./AIProvider.js";
import { localEmbedding } from "./localEmbedding.js";

/**
 * Proveedor de IA LOCAL (sin API externa). Redacta respuestas de forma
 * EXTRACTIVA: selecciona de las fuentes recuperadas la(s) frase(s) más
 * relevantes a la pregunta y las presenta con su cita [n]. Nunca inventa: solo
 * reordena y enmarca lo que ya está en las fuentes autorizadas.
 *
 * Pensado para establecimientos sin presupuesto/clave de IA. Para respuestas
 * generativas más ricas, basta cambiar AI_PROVIDER a gemini | openai | anthropic.
 */
export class LocalProvider implements AIProvider {
  readonly name = "local";

  isConfigured(): boolean {
    return true;
  }

  private static normalize(s: string): string {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Divide un fragmento en frases. */
  private static sentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    if (input.context.length === 0) {
      return { text: "", provider: this.name };
    }

    const keywords = new Set(
      LocalProvider.normalize(input.prompt)
        .split(" ")
        .filter((w) => w.length > 3),
    );

    // Puntúa cada frase de cada fuente por solape de palabras clave.
    type Cand = { sourceIdx: number; sentence: string; score: number };
    const cands: Cand[] = [];
    input.context.forEach((frag, idx) => {
      for (const sentence of LocalProvider.sentences(frag)) {
        const words = LocalProvider.normalize(sentence).split(" ");
        const score = words.reduce(
          (acc, w) => acc + (keywords.has(w) ? 1 : 0),
          0,
        );
        cands.push({ sourceIdx: idx, sentence, score });
      }
    });

    // Si nada puntúa (p. ej. consulta general), usa la primera frase de cada
    // fuente para no quedar en blanco.
    const conPuntaje = cands.filter((c) => c.score > 0);
    const elegidas = (conPuntaje.length > 0 ? conPuntaje : cands)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Mantiene el orden por fuente para una lectura coherente y cita [n].
    elegidas.sort((a, b) => a.sourceIdx - b.sourceIdx);

    const cuerpo = elegidas
      .map((c) => `${c.sentence} [${c.sourceIdx + 1}]`)
      .join(" ");

    const intro = input.history?.length
      ? "Con gusto. "
      : "Según la información del establecimiento: ";

    return { text: `${intro}${cuerpo}`, provider: this.name };
  }

  async embed(text: string): Promise<number[]> {
    return localEmbedding(text);
  }
}

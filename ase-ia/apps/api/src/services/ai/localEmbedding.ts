/**
 * Embedding determinista local (bolsa de palabras con hashing). No llama a
 * ninguna API: produce vectores comparables por similitud coseno, suficientes
 * para RAG sin claves ni costo. Compartido por los proveedores Local y Mock.
 */
export function localEmbedding(text: string, dims = 256): number[] {
  const v = new Array<number>(dims).fill(0);
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
    v[h % dims] += 1;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

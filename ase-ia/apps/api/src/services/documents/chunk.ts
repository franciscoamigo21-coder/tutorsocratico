/**
 * Divide el texto de un documento en fragmentos (chunks) manejables, base para
 * la recuperación. Corta por párrafos y agrupa hasta ~MAX_CHARS por chunk para
 * no fragmentar ideas. En M5 cada chunk recibirá su embedding.
 */

const MAX_CHARS = 600;

export function chunkText(text: string): string[] {
  const parrafos = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let actual = "";

  for (const p of parrafos) {
    if ((actual + " " + p).trim().length <= MAX_CHARS) {
      actual = (actual + " " + p).trim();
    } else {
      if (actual) chunks.push(actual);
      // Si un párrafo excede el máximo, se parte por oraciones.
      if (p.length > MAX_CHARS) {
        let buf = "";
        for (const frase of p.split(/(?<=[.!?])\s+/)) {
          if ((buf + " " + frase).trim().length <= MAX_CHARS) {
            buf = (buf + " " + frase).trim();
          } else {
            if (buf) chunks.push(buf);
            buf = frase;
          }
        }
        actual = buf;
      } else {
        actual = p;
      }
    }
  }
  if (actual) chunks.push(actual);
  return chunks;
}

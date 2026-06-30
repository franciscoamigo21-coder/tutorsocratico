/**
 * Extracción de texto de documentos según su tipo.
 * Las librerías pesadas (pdf-parse, mammoth) se importan de forma diferida para
 * no penalizar el arranque del servidor.
 */

export interface ExtractedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Devuelve el texto plano de un archivo soportado. */
export async function extractText(file: ExtractedFile): Promise<string> {
  const e = ext(file.originalname);
  const mime = file.mimetype || "";

  // Texto plano / Markdown
  if (mime.startsWith("text/") || e === "txt" || e === "md") {
    return file.buffer.toString("utf-8");
  }

  // PDF
  if (mime === "application/pdf" || e === "pdf") {
    const mod = await import("pdf-parse");
    const pdf = (mod as any).default ?? mod;
    const data = await pdf(file.buffer);
    return String(data.text ?? "");
  }

  // Word .docx
  if (
    e === "docx" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return String(result.value ?? "");
  }

  throw new Error(
    `Tipo de archivo no soportado: "${file.originalname}" (${mime}). ` +
      `Usa TXT, MD, PDF o DOCX.`,
  );
}

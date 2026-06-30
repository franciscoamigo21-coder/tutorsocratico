import type { Request, Response } from "express";
import { ROLES, type DocumentType, type Role } from "@ase-ia/shared";
import { getDocumentStore } from "../services/documents/index.js";
import { extractText } from "../services/documents/extract.js";
import { record } from "../services/audit/index.js";

const TIPOS: DocumentType[] = [
  "reglamento_interno",
  "pei",
  "protocolo",
  "programa_estudio",
  "manual",
  "rubrica",
  "calendario",
  "otro",
];

function parseRoles(raw: unknown): Role[] {
  if (Array.isArray(raw)) {
    return raw.filter((r): r is Role => ROLES.includes(r as Role));
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((r) => r.trim())
      .filter((r): r is Role => ROLES.includes(r as Role));
  }
  return [];
}

/** GET /api/documents — lista los documentos visibles para el rol. */
export async function listDocuments(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const docs = await getDocumentStore().listDocuments(user.schoolId, user.role);
  res.json(docs);
}

/**
 * POST /api/documents — sube un documento (archivo o texto pegado), extrae el
 * texto, lo trocea e indexa. Solo docentes.
 */
export async function uploadDocument(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.user!;
  const titulo = (req.body?.titulo ?? "").toString().trim();
  const tipoRaw = (req.body?.tipo ?? "otro").toString();
  const tipo: DocumentType = TIPOS.includes(tipoRaw as DocumentType)
    ? (tipoRaw as DocumentType)
    : "otro";
  const visibleParaRoles = parseRoles(req.body?.visibleParaRoles);

  if (!titulo) {
    res.status(400).json({ error: "Falta el título del documento" });
    return;
  }
  if (visibleParaRoles.length === 0) {
    res.status(400).json({ error: "Indica al menos un rol con visibilidad" });
    return;
  }

  // Texto: del archivo subido o del campo "texto".
  let texto = "";
  try {
    const file = (req as any).file as
      | { buffer: Buffer; mimetype: string; originalname: string }
      | undefined;
    if (file) {
      texto = await extractText(file);
    } else if (req.body?.texto) {
      texto = req.body.texto.toString();
    }
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
    return;
  }

  if (texto.trim().length < 10) {
    res
      .status(400)
      .json({ error: "No se pudo extraer texto suficiente del documento" });
    return;
  }

  const doc = await getDocumentStore().addDocument({
    schoolId: user.schoolId,
    titulo,
    tipo,
    texto,
    visibleParaRoles,
    url: req.body?.url?.toString(),
  });

  record({
    uid: user.uid,
    role: user.role,
    schoolId: user.schoolId,
    consulta: `[carga documento] ${titulo}`,
    resultado: "answered",
    fuentesCitadas: [doc.id],
    proveedorIA: "-",
  });

  res.status(201).json(doc);
}

/** DELETE /api/documents/:id — elimina un documento. Solo docentes. */
export async function deleteDocument(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.user!;
  const ok = await getDocumentStore().deleteDocument(
    user.schoolId,
    req.params.id,
  );
  if (!ok) {
    res.status(404).json({ error: "Documento no encontrado" });
    return;
  }
  res.json({ ok: true });
}

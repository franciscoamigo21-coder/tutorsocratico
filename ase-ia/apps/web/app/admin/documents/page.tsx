"use client";

import { useEffect, useState } from "react";
import type { DocumentType, KnowledgeDocument, Role } from "@ase-ia/shared";
import { useAuth } from "../../../hooks/useAuth";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
} from "../../../lib/api";

const TIPOS: { value: DocumentType; label: string }[] = [
  { value: "reglamento_interno", label: "Reglamento Interno" },
  { value: "pei", label: "PEI" },
  { value: "protocolo", label: "Protocolo" },
  { value: "programa_estudio", label: "Programa de estudio" },
  { value: "manual", label: "Manual" },
  { value: "rubrica", label: "Rúbrica" },
  { value: "calendario", label: "Calendario" },
  { value: "otro", label: "Otro" },
];

const ROLES: { value: Role; label: string }[] = [
  { value: "student", label: "Estudiante" },
  { value: "teacher", label: "Docente" },
  { value: "guardian", label: "Apoderado" },
];

export default function DocumentsAdmin() {
  const { role, configured } = useAuth();
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<DocumentType>("reglamento_interno");
  const [visibles, setVisibles] = useState<Role[]>(["student", "teacher", "guardian"]);
  const [file, setFile] = useState<File | null>(null);
  const [texto, setTexto] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      setDocs(await listDocuments());
    } catch (e) {
      setMsg((e as Error).message);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  // En modo invitado el rol por defecto de la API es estudiante: no puede subir.
  const puedeSubir = !configured || role === "teacher";

  function toggleRole(r: Role) {
    setVisibles((v) => (v.includes(r) ? v.filter((x) => x !== r) : [...v, r]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!titulo.trim() || visibles.length === 0 || (!file && !texto.trim())) {
      setMsg("Completa título, visibilidad y un archivo o texto.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.set("titulo", titulo);
      form.set("tipo", tipo);
      form.set("visibleParaRoles", visibles.join(","));
      if (file) form.set("file", file);
      else form.set("texto", texto);
      await uploadDocument(form);
      setMsg("✓ Documento indexado.");
      setTitulo("");
      setTexto("");
      setFile(null);
      await refresh();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteDocument(id);
      await refresh();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-brand-blue">
        Base de conocimiento
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Sube documentos institucionales (TXT, MD, PDF, DOCX). ASE-IA solo
        responderá con su contenido.
      </p>

      {puedeSubir ? (
        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-brand-border p-5"
        >
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título del documento"
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as DocumentType)}
              className="rounded-lg border border-brand-border px-3 py-2 text-sm"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="flex gap-3 text-sm">
              {ROLES.map((r) => (
                <label key={r.value} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={visibles.includes(r.value)}
                    onChange={() => toggleRole(r.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>
          <input
            type="file"
            accept=".txt,.md,.pdf,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block text-sm"
          />
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="…o pega el texto aquí (si no subes archivo)"
            rows={4}
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Subiendo…" : "Subir documento"}
          </button>
        </form>
      ) : (
        <p className="mt-6 rounded-lg bg-brand-gray p-4 text-sm text-slate-600">
          Debes iniciar sesión como docente para administrar documentos.
        </p>
      )}

      {msg && <p className="mt-3 text-sm text-brand-blue">{msg}</p>}

      <h2 className="mt-8 font-bold text-brand-blue">
        Documentos ({docs.length})
      </h2>
      <ul className="mt-3 space-y-2">
        {docs.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between rounded-lg border border-brand-border px-4 py-3 text-sm"
          >
            <div>
              <div className="font-semibold">{d.titulo}</div>
              <div className="text-xs text-slate-500">
                {d.tipo} · visible: {d.visibleParaRoles.join(", ")}
              </div>
            </div>
            {puedeSubir && (
              <button
                onClick={() => onDelete(d.id)}
                className="rounded-md border border-brand-border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Eliminar
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

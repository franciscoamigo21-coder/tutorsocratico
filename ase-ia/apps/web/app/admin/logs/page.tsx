"use client";

import { useEffect, useState } from "react";
import type { AuditLog } from "@ase-ia/shared";
import { fetchAuditLogs } from "../../../lib/api";

const COLOR: Record<AuditLog["resultado"], string> = {
  answered: "bg-green-100 text-green-700",
  no_info: "bg-amber-100 text-amber-700",
  out_of_scope: "bg-slate-100 text-slate-600",
  error: "bg-red-100 text-red-700",
};

export default function LogsAdmin() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs()
      .then(setLogs)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-brand-blue">
        Auditoría de consultas
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Cada consulta queda registrada con su rol, resultado y fuentes citadas.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          {error} (debes ser docente para ver la auditoría).
        </p>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-border text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-3">Hora</th>
              <th className="py-2 pr-3">Rol</th>
              <th className="py-2 pr-3">Consulta</th>
              <th className="py-2 pr-3">Resultado</th>
              <th className="py-2 pr-3">Fuentes</th>
              <th className="py-2">IA</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-brand-border/60">
                <td className="py-2 pr-3 text-xs text-slate-500">
                  {new Date(l.timestamp).toLocaleString("es-CL")}
                </td>
                <td className="py-2 pr-3">{l.role}</td>
                <td className="py-2 pr-3 max-w-[280px] truncate" title={l.consulta}>
                  {l.consulta}
                </td>
                <td className="py-2 pr-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR[l.resultado]}`}>
                    {l.resultado}
                  </span>
                </td>
                <td className="py-2 pr-3 text-xs">{l.fuentesCitadas.length}</td>
                <td className="py-2 text-xs text-slate-500">{l.proveedorIA}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && !error && (
          <p className="mt-4 text-sm text-slate-400">Sin registros aún.</p>
        )}
      </div>
    </main>
  );
}

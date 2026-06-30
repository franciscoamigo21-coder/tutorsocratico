"use client";

import { useState } from "react";
import type { Role } from "@ase-ia/shared";
import { assignRole } from "../../../lib/api";

const ROLES: { value: Role; label: string }[] = [
  { value: "student", label: "Estudiante" },
  { value: "teacher", label: "Docente" },
  { value: "guardian", label: "Apoderado" },
];

export default function RolesAdmin() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!email.trim()) {
      setMsg("Ingresa el correo del usuario.");
      return;
    }
    setBusy(true);
    try {
      await assignRole(email.trim(), role);
      setMsg(`✓ Rol "${role}" asignado a ${email}. El usuario debe reiniciar sesión.`);
      setEmail("");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-brand-blue">Gestión de roles</h1>
      <p className="mt-1 text-sm text-slate-500">
        Asigna el perfil de un usuario por su correo institucional. El rol viaja
        en el token; el usuario debe volver a iniciar sesión.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-brand-border p-5"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@colegio.cl"
          className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Asignando…" : "Asignar rol"}
        </button>
      </form>

      {msg && <p className="mt-3 text-sm text-brand-blue">{msg}</p>}
    </main>
  );
}

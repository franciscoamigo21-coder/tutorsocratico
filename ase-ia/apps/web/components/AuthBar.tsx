"use client";

import type { Role } from "@ase-ia/shared";
import { useAuth } from "../hooks/useAuth";

const ROLE_LABEL: Record<Role, string> = {
  student: "Estudiante",
  teacher: "Docente",
  guardian: "Apoderado",
};

/**
 * Barra de sesión. Si Firebase no está configurado, muestra el modo invitado
 * (la API usa su fallback de desarrollo).
 */
export default function AuthBar() {
  const { user, role, loading, configured, signIn, signOut } = useAuth();

  if (!configured) {
    return (
      <div className="rounded-lg bg-brand-gray px-3 py-2 text-xs text-slate-500">
        Modo invitado (Firebase no configurado)
      </div>
    );
  }

  if (loading) {
    return <div className="text-xs text-slate-400">Cargando sesión…</div>;
  }

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white"
      >
        Iniciar sesión con Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right text-xs">
        <div className="font-semibold text-brand-blue">
          {user.displayName ?? user.email}
        </div>
        <div className="text-slate-500">
          {role ? ROLE_LABEL[role] : "Sin rol asignado"}
        </div>
      </div>
      <button
        onClick={signOut}
        className="rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-blue hover:bg-brand-gray"
      >
        Salir
      </button>
    </div>
  );
}

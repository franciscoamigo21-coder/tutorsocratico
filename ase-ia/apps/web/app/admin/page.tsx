import Link from "next/link";

const CARDS = [
  {
    href: "/admin/documents",
    title: "Documentos",
    desc: "Cargar, listar y eliminar la base de conocimiento.",
    icon: "📄",
  },
  {
    href: "/admin/roles",
    title: "Roles",
    desc: "Asignar perfil (estudiante, docente, apoderado) por correo.",
    icon: "👤",
  },
  {
    href: "/admin/logs",
    title: "Auditoría",
    desc: "Revisar las consultas registradas y sus resultados.",
    icon: "📊",
  },
];

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-brand-blue">
        Panel de administración
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Gestión institucional de ASE-IA (acceso para docentes).
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-brand-border p-5 transition hover:border-brand-bright hover:shadow-sm"
          >
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-2 font-bold text-brand-blue">{c.title}</div>
            <p className="mt-1 text-sm text-slate-600">{c.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

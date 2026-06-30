import AuthBar from "../components/AuthBar";
import Avatar from "../components/Avatar";
import FloatingChat from "../components/FloatingChat";

const CAPACIDADES = [
  { icon: "📚", title: "Tareas y materiales", desc: "Encuentra qué tienes pendiente y dónde está el material." },
  { icon: "📅", title: "Fechas y calendario", desc: "Próximas evaluaciones, reuniones y eventos del colegio." },
  { icon: "📖", title: "Reglamentos y protocolos", desc: "Consulta el Reglamento Interno, el PEI y los protocolos." },
  { icon: "✉️", title: "Redacción de correos", desc: "Te ayuda a redactar justificativos y comunicaciones." },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Barra superior */}
      <header className="sticky top-0 z-50 border-b border-brand-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar size={34} />
            <div className="leading-tight">
              <div className="font-extrabold text-brand-blue">ASE-IA</div>
              <div className="text-[11px] text-slate-500">SIP Red de Colegios</div>
            </div>
          </div>
          <AuthBar />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-14 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-blue sm:text-4xl">
          Asistente Escolar de Inteligencia Artificial
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Colegio Presidente José Joaquín Prieto. Pregunta en lenguaje natural por
          tareas, documentos, reglamentos y fechas. ASE-IA responde solo con
          información autorizada por el establecimiento, y nunca inventa.
        </p>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
          {CAPACIDADES.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm"
            >
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-2 font-bold text-brand-blue">{c.title}</div>
              <p className="mt-1 text-sm text-slate-600">{c.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-500">
          Toca el botón <span className="font-semibold text-brand-blue">ASE-IA</span>{" "}
          abajo a la derecha para comenzar.
        </p>
      </section>

      <FloatingChat />
    </main>
  );
}

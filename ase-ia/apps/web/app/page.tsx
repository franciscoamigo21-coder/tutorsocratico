import Chat from "../components/Chat";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-blue">
          ASE-IA
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Asistente Escolar de Inteligencia Artificial · Colegio Presidente
          José Joaquín Prieto · SIP Red de Colegios
        </p>
      </header>
      <Chat />
      <p className="mt-6 text-center text-xs text-slate-400">
        ASE-IA solo responde con información autorizada por el establecimiento.
        Nunca inventa.
      </p>
    </main>
  );
}

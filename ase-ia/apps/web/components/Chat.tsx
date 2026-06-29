"use client";

import { useState } from "react";
import type { Citation } from "@ase-ia/shared";
import { sendChat } from "../lib/api";

interface Msg {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

const SUGERENCIAS = [
  "¿Qué dice el reglamento sobre atrasos?",
  "¿Cuándo termina el semestre?",
  "¿Cómo justifico una ausencia?",
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "¡Hola! Soy ASE-IA. Pregúntame por tareas, fechas, reglamentos o documentos del colegio.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendChat({ message: q });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.reply, citations: res.citations },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "No pude conectar con el asistente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-brand-border shadow-sm">
      <div className="flex items-center gap-2 bg-brand-blue px-4 py-3 text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-bright text-xs font-extrabold text-brand-blue">
          AI
        </span>
        <span className="font-bold">ASE-IA</span>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-brand-gray p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              m.role === "user"
                ? "self-end bg-brand-blue text-white"
                : "self-start border border-brand-border bg-white"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
            {m.citations && m.citations.length > 0 && (
              <p className="mt-1 text-[11px] text-slate-500">
                Fuentes: {m.citations.map((c) => c.titulo).join(" · ")}
              </p>
            )}
          </div>
        ))}
        {loading && (
          <div className="self-start rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-slate-400">
            ASE-IA está pensando…
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-brand-border bg-white px-4 pt-3">
        {SUGERENCIAS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="rounded-full border border-brand-border px-3 py-1 text-xs text-brand-blue hover:bg-brand-gray"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          className="flex-1 rounded-xl border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-bright"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-blue px-4 font-bold text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

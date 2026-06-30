"use client";

import { useEffect, useRef, useState } from "react";
import type { Citation } from "@ase-ia/shared";
import { sendChat } from "../lib/api";
import Avatar from "./Avatar";

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
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendChat({ message: q, history });
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

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* Encabezado */}
      <div className="flex items-center gap-2.5 bg-brand-blue px-4 py-3 text-white">
        <Avatar size={30} />
        <div className="leading-tight">
          <div className="text-sm font-bold">ASE-IA</div>
          <div className="text-[11px] text-blue-100/80">Asistente Escolar</div>
        </div>
      </div>

      {/* Mensajes */}
      <div
        ref={logRef}
        className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-brand-gray p-4"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${
              m.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {m.role === "assistant" && <Avatar size={24} className="mb-0.5 shrink-0" />}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                m.role === "user"
                  ? "rounded-br-sm bg-brand-blue text-white"
                  : "rounded-bl-sm border border-brand-border bg-white"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.citations.map((c) => (
                    <span
                      key={c.docId}
                      className="rounded-full bg-brand-gray px-2 py-0.5 text-[11px] font-medium text-brand-blue"
                      title={c.fragmento}
                    >
                      [{c.index}] {c.titulo}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2">
            <Avatar size={24} className="mb-0.5 shrink-0" />
            <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-brand-border bg-white px-3.5 py-3">
              <span className="dot" />
              <span className="dot" style={{ animationDelay: "0.15s" }} />
              <span className="dot" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias */}
      {showSuggestions && (
        <div className="flex flex-wrap gap-2 border-t border-brand-border bg-white px-4 pt-3">
          {SUGERENCIAS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-brand-border px-3 py-1 text-xs text-brand-blue transition hover:bg-brand-gray"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Entrada */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          className="flex-1 rounded-xl border border-brand-border px-3 py-2.5 text-sm outline-none transition focus:border-brand-bright focus:ring-2 focus:ring-brand-bright/20"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-brand-blue px-4 font-bold text-white transition hover:bg-brand-blue/90 disabled:opacity-40"
          aria-label="Enviar"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

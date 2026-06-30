"use client";

import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import Chat from "./Chat";

/**
 * Lanzador flotante del chat. Escritorio: tarjeta anclada abajo a la derecha.
 * Móvil: ocupa la pantalla completa. Cierra con Escape.
 */
export default function FloatingChat() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-white shadow-2xl
                     sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[600px] sm:max-h-[80vh]
                     sm:w-[380px] sm:max-w-[92vw] sm:rounded-2xl sm:border sm:border-brand-border"
          role="dialog"
          aria-label="ASE-IA"
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-10 text-white/80 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <Chat />
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[61] flex items-center gap-2 rounded-full
                   bg-brand-blue px-4 py-3 font-bold text-white shadow-lg
                   transition hover:scale-105 hover:bg-brand-blue/90"
        aria-label={open ? "Cerrar ASE-IA" : "Abrir ASE-IA"}
      >
        <Avatar size={26} />
        <span className="hidden sm:inline">{open ? "Cerrar" : "ASE-IA"}</span>
      </button>
    </>
  );
}

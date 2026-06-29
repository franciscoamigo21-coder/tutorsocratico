import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASE-IA · Asistente Escolar de Inteligencia Artificial",
  description:
    "Asistente Escolar de IA del Colegio Presidente José Joaquín Prieto (SIP Red de Colegios).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-[#16243a] antialiased">
        {children}
      </body>
    </html>
  );
}

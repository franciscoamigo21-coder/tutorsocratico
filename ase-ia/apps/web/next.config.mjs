/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ase-ia/shared"],
  // Exportación estática para Firebase Hosting (genera apps/web/out).
  // La app llama a la API en tiempo de ejecución, así que no necesita servidor.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

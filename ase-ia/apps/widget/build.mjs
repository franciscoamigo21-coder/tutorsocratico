/**
 * Empaqueta el widget a dist/: minifica loader.js y copia los HTML.
 * Resultado desplegable junto a la web en Firebase Hosting.
 */
import { build } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";

const OUT = "dist";

await mkdir(OUT, { recursive: true });

await build({
  entryPoints: ["src/loader.js"],
  outfile: `${OUT}/loader.js`,
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2018"],
});

await copyFile("src/embed.html", `${OUT}/embed.html`);
await copyFile("src/demo.html", `${OUT}/demo.html`);

console.log("✓ widget empaquetado en dist/ (loader.js, embed.html, demo.html)");

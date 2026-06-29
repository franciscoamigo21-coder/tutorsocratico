import type { Config } from "tailwindcss";

/** Paleta institucional: azul / blanco / gris claro (estilo Google). */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1b3a66",
          bright: "#4fc3f7",
          gray: "#f1f4f9",
          border: "#d9e1ec",
        },
      },
    },
  },
  plugins: [],
};

export default config;

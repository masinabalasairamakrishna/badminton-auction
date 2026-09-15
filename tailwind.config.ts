import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        badminton: {
          court: "#0f382c",
          courtLight: "#16533f",
          net: "#ffffff",
          gold: "#f59e0b",
          goldLight: "#fbbf24",
          shuttle: "#38bdf8",
          neon: "#10b981",
          card: "#131d2a",
          cardBorder: "#243447"
        }
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slight": "bounce 2s infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(16, 185, 129, 0.4)" },
          "100%": { boxShadow: "0 0 35px rgba(16, 185, 129, 0.9)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;

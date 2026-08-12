import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Brand from logo + portfolio doc
        xblue: {
          50: "#eef4fb",
          100: "#d6e4f3",
          200: "#aac6e3",
          300: "#7aa6d2",
          400: "#4a86c1",
          500: "#2a68a8",
          600: "#1A3C5E", // primary deep blue (logo)
          700: "#152f4a",
          800: "#0f2236",
          900: "#0a1623"
        },
        xgold: {
          400: "#e6a23c",
          500: "#d18a1b",
          600: "#C47D0E", // mustard (logo + Consult)
          700: "#a06509"
        },
        xteal: { 500: "#0A7E6A" },     // Guard
        xpurple: { 500: "#5B2D8E" },   // Agentic AI
        xred: { 500: "#B22222" },      // Cyber
        // semantic
        bg: {
          DEFAULT: "var(--bg)",
          subtle: "var(--bg-subtle)",
          elevated: "var(--bg-elevated)"
        },
        fg: {
          DEFAULT: "var(--fg)",
          muted: "var(--fg-muted)",
          subtle: "var(--fg-subtle)"
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)"
        }
      },
      boxShadow: {
        glow: "0 0 60px rgba(26, 60, 94, 0.35)",
        gold: "0 0 40px rgba(196, 125, 14, 0.35)"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
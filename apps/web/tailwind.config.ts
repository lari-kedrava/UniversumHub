import type { Config } from "tailwindcss";

/**
 * Tokens de tema do Universum Hub. Cores centralizadas aqui —
 * nenhum componente deve usar hex direto no className.
 */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          300: "#93b4ff",
          500: "#3766ff",
          600: "#2850db",
          700: "#1f3fae",
          900: "#132667",
        },
        surface: {
          DEFAULT: "#0f1117",
          raised: "#161923",
          border: "#242836",
        },
      },
      borderRadius: {
        xl: "0.875rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

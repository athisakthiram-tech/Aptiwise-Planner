import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fbf6",
          100: "#daf5e7",
          500: "#0f9d58",
          600: "#0c8148",
          700: "#0a6a3c",
        },
        ink: {
          900: "#0f172a",
          700: "#334155",
          500: "#64748b",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf4fb",
          100: "#fbe8f7",
          200: "#f7d2ee",
          300: "#efaddf",
          400: "#e17cc8",
          500: "#8D397E", // Signature HelpMate Magenta Theme
          600: "#772b68",
          700: "#632255",
          800: "#521e46",
          900: "#441d3b",
          950: "#290b22",
        },
        light: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          surface: "#F1F5F9",
          hover: "#F8FAFC",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        lux: "0 10px 30px -10px rgba(141, 57, 126, 0.25)",
        card: "0 4px 20px 0 rgba(0, 0, 0, 0.05)",
        panel: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      },
    },
  },
  plugins: [],
};
export default config;

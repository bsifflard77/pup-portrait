/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#1e1e2e",
          foreground: "#ffffff",
        },
        background: "#0f0f1a",
        foreground: "#ffffff",
        card: {
          DEFAULT: "#1a1a2e",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#2a2a3e",
          foreground: "#a1a1aa",
        },
        accent: {
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        border: "#2a2a3e",
      },
    },
  },
  plugins: [],
};

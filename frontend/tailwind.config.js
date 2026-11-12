/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      colors: {
        // FlowMind design tokens — matches sdlc-models.html dark palette
        bg: "#0c0f1a",
        surface: "#141827",
        surface2: "#1a1f30",
        border: "#2a3251",
        accent: "#38bdf8",
        "accent-soft": "#0c2a3f",
        fg: "#e2e8f4",
        "fg-muted": "#9499b0",
        "fg-subtle": "#5d6380",
        success: "#34d399",
        warning: "#fbbf24",
        danger: "#f87171",
        purple: "#a78bfa",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};

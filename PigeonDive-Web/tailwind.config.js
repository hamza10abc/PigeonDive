/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Newsreader Variable"', "Georgia", "serif"],
        sans: ['"Hanken Grotesk Variable"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "monospace"],
      },
      colors: {
        // Feather-grey paper, ink, and a pigeon's green-gold neck sheen. Nothing purple.
        paper: "#ECEEEB",
        surface: "#F6F7F5",
        ink: "#111418",
        "ink-2": "#4F5753",
        "ink-3": "#848B87",
        line: "#D9DDD8",
        "line-2": "#C4C9C3",
        feather: "#0F5C4A",
        sky: "#2F5FD0",
        alert: "#B8392A",
        amber: "#A86B12",
      },
      borderRadius: { field: "10px", panel: "14px" },
      boxShadow: {
        float: "0 12px 40px -12px rgba(17,20,24,0.28), 0 2px 6px rgba(17,20,24,0.06)",
        press: "0 1px 0 rgba(17,20,24,0.06)",
      },
      keyframes: {
        enter: { from: { opacity: "0" }, to: { opacity: "1" } },
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "0%": { backgroundPosition: "-200px 0" }, "100%": { backgroundPosition: "200px 0" } },
        slideIn: { from: { transform: "translateX(24px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
        slideUp: { from: { transform: "translateY(24px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
        beat: { "0%,100%": { transform: "scale(1)", opacity: "1" }, "50%": { transform: "scale(1.5)", opacity: "0.35" } },
        fly: { from: { offsetDistance: "0%" }, to: { offsetDistance: "100%" } },
      },
      animation: {
        enter: "enter 160ms ease-out",
        rise: "rise 320ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        shimmer: "shimmer 1.4s linear infinite",
        "slide-in": "slideIn 220ms cubic-bezier(0.2, 0.7, 0.2, 1)",
        "slide-up": "slideUp 240ms cubic-bezier(0.2, 0.7, 0.2, 1)",
        beat: "beat 1.4s ease-in-out infinite",
        fly: "fly 9s linear infinite",
      },
    },
  },
  plugins: [],
};

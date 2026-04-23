const tailwindcssAnimate = require("tailwindcss-animate");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  safelist: [
    "bg-emerald-50", "text-emerald-700", "ring-emerald-200", "text-emerald-600",
    "bg-amber-50", "text-amber-700", "ring-amber-200", "text-amber-600",
    "bg-sky-50", "text-sky-700", "ring-sky-200", "text-sky-600",
    "bg-rose-50", "text-rose-700", "ring-rose-200", "text-rose-600",
    "bg-slate-100", "text-slate-500", "ring-slate-200",
    "bg-indigo-50", "text-indigo-700", "ring-indigo-200", "text-indigo-600",
    "bg-violet-50", "text-violet-700", "ring-violet-200", "text-violet-600",
    "bg-cyan-50", "text-cyan-700", "ring-cyan-200", "text-cyan-600",
    "bg-orange-50", "text-orange-700", "ring-orange-200", "text-orange-600",
    "bg-purple-50", "text-purple-700", "ring-purple-200", "text-purple-600",
    "bg-yellow-50", "text-yellow-700", "ring-yellow-200", "text-yellow-600",
    "bg-green-50", "text-green-700", "ring-green-200", "text-green-600",
    "border-emerald-200", "border-amber-200", "border-sky-200", "border-rose-200",
    "border-indigo-200", "border-violet-200", "border-cyan-200", "border-orange-200",
    "border-purple-200", "border-yellow-200", "border-green-200",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
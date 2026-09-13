import type { Config } from "tailwindcss";

function withOpacity(varName: string) {
  return `rgb(var(${varName}) / <alpha-value>)`;
}

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Color tokens resolve to CSS custom properties (set per data-theme in
        // globals.css) so switching themes re-colors the whole app without
        // touching individual component classNames.
        cream: {
          DEFAULT: withOpacity("--color-cream-100"),
          50: withOpacity("--color-cream-50"),
          100: withOpacity("--color-cream-100"),
          200: withOpacity("--color-cream-200"),
          300: withOpacity("--color-cream-300"),
        },
        sage: {
          50: withOpacity("--color-sage-50"),
          100: withOpacity("--color-sage-100"),
          200: withOpacity("--color-sage-200"),
          300: withOpacity("--color-sage-300"),
          400: withOpacity("--color-sage-400"),
          500: withOpacity("--color-sage-500"),
          600: withOpacity("--color-sage-600"),
          700: withOpacity("--color-sage-700"),
        },
        ink: {
          DEFAULT: withOpacity("--color-ink"),
          light: withOpacity("--color-ink-light"),
        },
        surface: withOpacity("--color-surface"),
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 4px 20px -4px rgba(80, 70, 40, 0.10), 0 2px 6px -2px rgba(80,70,40,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;

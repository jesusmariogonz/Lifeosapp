import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#faf8f3",
          50: "#fdfcfa",
          100: "#faf8f3",
          200: "#f3efe3",
          300: "#eae3d0",
        },
        sage: {
          50: "#f2f5ee",
          100: "#e3e9da",
          200: "#c9d5b9",
          300: "#aebd97",
          400: "#8a9a7e",
          500: "#728565",
          600: "#5b6b50",
          700: "#485440",
        },
        ink: {
          DEFAULT: "#2f2c26",
          light: "#6b6558",
        },
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

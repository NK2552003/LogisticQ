/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: "#2563eb",
          light: "#3b82f6",
          dark: "#1e40af",
        },
        secondary: {
          DEFAULT: "#22c55e",
          light: "#4ade80",
          dark: "#16a34a",
        },
        accent: {
          DEFAULT: "#f59e42",
          light: "#fbbf24",
          dark: "#b45309",
        },

        // Text colors
        text: {
          DEFAULT: "#1e293b", // Main text
          secondary: "#64748b", // Subtle text
          muted: "#94a3b8", // Muted/disabled text
          inverted: "#f3f4f6", // On dark backgrounds
          link: "#2563eb", // Links
          error: "#ef4444", // Error text
          success: "#22c55e", // Success text
          warning: "#f59e42", // Warning text
        },

        // Icon colors
        icon: {
          DEFAULT: "#2563eb", // Main icons
          secondary: "#64748b", // Secondary icons
          accent: "#f59e42", // Accent icons
          error: "#ef4444", // Error icons
          success: "#22c55e", // Success icons
          warning: "#f59e42", // Warning icons
        },

        // Background colors
        background: {
          DEFAULT: "#f3f4f6", // Main background
          surface: "#ffffff", // Cards, surfaces
          elevated: "#e5e7eb", // Elevated surfaces
          muted: "#e2e8f0", // Muted backgrounds
          inverted: "#1e293b", // Dark backgrounds
          primary: "#2563eb", // Brand background
          secondary: "#22c55e", // Secondary background
          accent: "#f59e42", // Accent background
        },
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "Arial", "sans-serif"],
        heading: ["Montserrat", "Inter", "sans-serif"],
        mono: ["Fira Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

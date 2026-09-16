/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'obsidian-base': '#090D16',      // Deepest Void base
        'obsidian-surface': '#121824',   // Surface containers
        'obsidian-border': '#1E293B',    // 1px Container borders
        'accent-cyan': '#00F0FF',        // Neon Teal primary glow
        'accent-purple': '#8B5CF6',      // Cyber Violet secondary accent
        'status-emerald': '#10B981',     // Success / Unlocked
        'status-amber': '#F59E0B',       // Warning / Time low
        'status-red': '#EF4444',         // Error / Locked
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
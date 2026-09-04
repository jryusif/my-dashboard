/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0b0f17',
          surface: '#121824',
          card: '#182232',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: '#1e2b3e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 24px -4px rgba(56, 189, 248, 0.3)',
        'glow-success': '0 0 24px -4px rgba(52, 211, 153, 0.3)',
        'glow-flame': '0 0 24px -4px rgba(249, 115, 22, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'level-up': 'bounce 0.6s ease-in-out',
      }
    },
  },
  plugins: [],
};

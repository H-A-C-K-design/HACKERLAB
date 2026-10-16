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
        background: '#0A0F1C',
        surface: {
          DEFAULT: '#111827',
          card: '#151E32',
          hover: '#1E293B',
          light: '#1F2937'
        },
        accent: {
          DEFAULT: '#22D3EE',
          dark: '#0891B2',
          light: '#67E8F9',
          glow: 'rgba(34, 211, 238, 0.15)'
        },
        secondary: {
          DEFAULT: '#2DD4BF',
          dark: '#0D9488',
          light: '#5EEAD4'
        },
        cyber: {
          danger: '#F43F5E',
          success: '#22C55E',
          warning: '#F59E0B',
          text: '#E5E7EB',
          muted: '#94A3B8',
          border: 'rgba(34, 211, 238, 0.15)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cyber': '0 0 20px -5px rgba(34, 211, 238, 0.25)',
        'cyber-sm': '0 0 10px -2px rgba(34, 211, 238, 0.15)',
        'cyber-hover': '0 0 25px 0px rgba(34, 211, 238, 0.3)',
      },
      borderRadius: {
        'card': '12px',
      }
    },
  },
  plugins: [],
}

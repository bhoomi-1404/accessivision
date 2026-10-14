/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        studio: {
          bg: '#090B10',
          panel: '#0F1219',
          card: '#161B26',
          border: '#232A3B',
          accent: '#6366F1',
        }
      }
    },
  },
  plugins: [],
}

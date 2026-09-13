/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf8ea',
          100: '#f5efc7',
          200: '#ecd992',
          300: '#e1be57',
          400: '#d7a42b',
          500: '#bf861c',
          600: '#a36615',
          700: '#814814',
          800: '#6d3a17',
          900: '#5d3118',
        },
        emerald: {
          950: '#022018',
        }
      },
      fontFamily: {
        arabic: ['Cairo', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#193126',
        green: '#246b45',
        'green-light': '#2e8b57',
        'green-dark': '#1a5335',
        cream: '#f5f3e8',
        line: '#d8dfd1',
        'line-dark': '#bccdb3',
        error: '#a22',
        success: '#246b45',
        warning: '#b8860b',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8eee8',
          100: '#f2dccf',
          200: '#e9c3ab',
          300: '#df9f75',
          400: '#d58351',
          500: '#c26939',
          600: '#b35e33',
          700: '#924c2a',
          800: '#6f3921',
          900: '#4d2717',
        },
        coconut: {
          100: '#4a4a4a',
          200: '#3f3f3f',
          300: '#383838',
          400: '#343434',
          500: '#303030',
        },
      },
      boxShadow: {
        soft: '0 24px 48px rgba(0, 0, 0, 0.32)',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#082347', 800: '#0A2D5E', 700: '#123B77', 600: '#1B4D94', 100: '#E8EEF7' },
        accent: { DEFAULT: '#F59E0B', dark: '#D97706' },
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

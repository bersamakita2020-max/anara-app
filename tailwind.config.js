/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0B',
        ivory: '#F7F7F5',
        violet: '#7C3AED',
        azure: '#1FA2FF',
        edu: '#0F9D76',
        gold: '#C6A15B',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        pill: '999px',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Fraunces', 'serif'],
      },
      colors: {
        paper: '#FDFBF7',
        ink: '#1F2937',
        night: '#0E1117',
        cream: '#F3F4F6',
        accent: '#3B82F6',
        amber: '#F59E0B',
        teal: '#14B8A6',
      },
      boxShadow: {
        card: '0 10px 25px -15px rgba(15, 23, 42, 0.35)',
      },
    },
  },
  plugins: [],
}


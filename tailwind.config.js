/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a5f',
        'primary-dark': '#14284a',
        accent: '#c9a227',
        'accent-dark': '#a8841f',
        paper: '#f7f4ef',
        ink: '#1a1a1a',
        muted: '#5f5a52',
      },
      fontFamily: {
        sans: ['Inter', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
        serif: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,25,23,0.06), 0 12px 32px -18px rgba(28,25,23,0.35)',
        lift: '0 2px 4px rgba(28,25,23,0.08), 0 24px 48px -24px rgba(28,25,23,0.45)',
      },
    },
  },
  plugins: [],
};

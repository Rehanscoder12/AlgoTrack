/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17201e',
        muted: '#747b77',
        line: '#e5e7e3',
        paper: '#f8f8f6',
        accent: '#e97945',
        'accent-soft': '#fff0e8',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

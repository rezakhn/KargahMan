/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#14b8a6', // teal-500
        'primary-focus': '#0d9488', // teal-600
        'background': '#1f2937', // gray-800
        'surface': '#374151', // gray-700
        'on-surface': '#f3f4f6', // gray-100
        'on-surface-secondary': '#9ca3af' // gray-400
      }
    }
  },
  plugins: [],
}

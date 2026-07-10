/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#1a73e8',
          red: '#ea4335',
          yellow: '#fbbc05',
          green: '#34a853',
        }
      }
    },
  },
  plugins: [],
}

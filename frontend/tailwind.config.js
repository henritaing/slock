/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Check if your files are indeed .jsx
  ],
  theme: {
    extend: {
      colors: {
        'brand-black': '#0a0a0a',
        'brand-blue': '#1e293b',
        'brand-beige': '#f5f5f4',
      }
    },
  },
  plugins: [],
}
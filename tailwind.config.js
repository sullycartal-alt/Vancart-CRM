/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media', // Mode sombre via prefers-color-scheme
  theme: {
    extend: {
      colors: {
        primary: '#6C47FF', // Violet principal VanCart
        fond: '#F9FAFB',
      },
    },
  },
  plugins: [],
}

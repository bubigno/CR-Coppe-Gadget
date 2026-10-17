/** @type {import('tailwindcss').Config} */
module.exports = {
    blocklist: ["overline"],
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F6F4ED',
        surface: '#FFFFFF',
        surface2: '#EFEBDF',
        char: '#191C22',
        ink: '#0D0E12',
        card: '#151821',
        card2: '#1D2230',
        gold: { DEFAULT: '#C9A227', bright: '#E3C558', deep: '#8C6D1F' },
        line: 'rgba(25,28,34,0.10)',
        linegold: 'rgba(201,162,39,0.35)'
      },
      fontFamily: {
        display: ['"Clash Display"', 'Playfair Display', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        shine: { '0%': { opacity: 0.3 }, '50%': { opacity: 0.8 }, '100%': { opacity: 0.3 } }
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        shine: 'shine 5s ease-in-out infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
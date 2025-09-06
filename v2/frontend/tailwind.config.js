/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nico-red': '#FF0000',
        'nico-pink': '#FF8080',
        'nico-orange': '#FFC000',
        'nico-yellow': '#FFFF00',
        'nico-green': '#00FF00',
        'nico-cyan': '#00FFFF',
        'nico-blue': '#0000FF',
        'nico-purple': '#C000FF',
      },
      animation: {
        'slide-left': 'slideLeft 4s linear',
        'fade-in': 'fadeIn 0.5s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
      },
      keyframes: {
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
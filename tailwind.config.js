/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'selector', // Use class-based dark mode with 'dark' class
  theme: {
    extend: {
      colors: {
        'nyt-yellow': '#f9df6d',
        'nyt-green': '#a0c35a',
        'nyt-blue': '#b0c4ef',
        'nyt-purple': '#ba81c5',
        'nyt-beige': {
          light: '#efefe6',
          dark: '#5a594e',
        },
      },
      keyframes: {
        slideIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(-20px) scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },
      },
      animation: {
        slideIn: 'slideIn 0.6s ease-out',
      },
    },
  },
  plugins: [],
}

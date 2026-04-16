/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        velvet: 'velvetPulse 2.2s ease-in-out infinite',
      },
      keyframes: {
        velvetPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.06)' },
        },
      },
    },
  },
  plugins: [],
}
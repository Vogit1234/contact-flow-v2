/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "slide-in-from-right-full": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" }
        },
        "fade-out-80": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0.2" }
        }
      },
      animation: {
        "slide-in-from-right-full": "slide-in-from-right-full 0.3s ease-out",
        "fade-out-80": "fade-out-80 0.3s ease-out"
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      // Tailwind defaults: sm 640, md 768, lg 1024, xl 1280, 2xl 1536
      // Adding `xs` so we can show labels alongside icons even on small phones.
      xs:  '480px',
      sm:  '640px',
      md:  '768px',
      lg:  '1024px',
      xl:  '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        ink: {
          900: '#0c0a14',
          800: '#14101f',
          700: '#1a1428',
          600: '#221a35',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'glow-pink':   '0 0 32px rgba(236, 72, 153, 0.35)',
        'glow-purple': '0 0 32px rgba(168, 85, 247, 0.30)',
        'card':        '0 8px 30px rgba(0, 0, 0, 0.35)',
        'card-hover':  '0 18px 50px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
}

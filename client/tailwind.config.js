/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0A09',
        ink: '#F5F1EA',
        surface: '#161311',
        surfaceHover: '#1F1B17',
        accent: '#5B4EE5',
        accentDeep: '#3C2FBF',
        stage: '#14110F',
        stageLight: '#241D18',
        marquee: '#F2B705',
        velvet: '#8C2F2F',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        marquee: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      keyframes: { chase: { '0%': { backgroundPosition: '0 0' }, '100%': { backgroundPosition: '40px 0' } } },
      animation: { chase: 'chase 1.2s linear infinite' },
    },
  },
  plugins: [],
};
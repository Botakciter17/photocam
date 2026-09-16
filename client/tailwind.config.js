/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        duo: {
          red: '#D34B4D',
          redDark: '#A83234',
          redDeep: '#7E2123',
          redLight: '#FFF0F0',
          yellow: '#FFC800',
          yellowDark: '#E5A500',
          green: '#58CC02',
          greenDark: '#46A302',
          blue: '#1CB0F6',
          blueDark: '#1899D6',
          bg: '#FDF7F5',
          card: '#FFFFFF',
          border: '#E8CEC9',
          muted: '#8B7B78',
          text: '#4B3F3D',
          darkBg: '#1A1415',
          darkCard: '#271E20',
          darkBorder: '#3E2F32'
        }
      },
      boxShadow: {
        'duo-sm': '0 3px 0 #A83234',
        'duo-md': '0 5px 0 #A83234',
        'duo-lg': '0 7px 0 #A83234',
        'duo-gray': '0 4px 0 #D5C2BE',
        'duo-green': '0 5px 0 #46A302',
        'duo-yellow': '0 5px 0 #E5A500'
      }
    },
  },
  plugins: [],
}

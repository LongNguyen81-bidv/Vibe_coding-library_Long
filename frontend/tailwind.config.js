/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc4fb',
          400: '#36a5f7',
          500: '#0c87e8',
          600: '#0069c6',
          700: '#0154a1',
          800: '#064785',
          900: '#0b3c6e',
          950: '#07264a',
        },
        secondary: {
          50: '#fdf8f3',
          100: '#faeee2',
          200: '#f4d9c4',
          300: '#ecbf9c',
          400: '#e29c6c',
          500: '#da8049',
          600: '#cc6a3e',
          700: '#aa5534',
          800: '#894631',
          900: '#6f3b2a',
          950: '#3c1d14',
        },
        accent: {
          50: '#f6f5f0',
          100: '#e9e6d9',
          200: '#d5cfb5',
          300: '#bdb28a',
          400: '#a99868',
          500: '#9a875a',
          600: '#846e4b',
          700: '#6b563e',
          800: '#5b4938',
          900: '#4f4033',
          950: '#2d231a',
        }
      },
      fontFamily: {
        sans: ['Lexend', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #0b3c6e 0%, #0c87e8 50%, #064785 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      }
    },
  },
  plugins: [],
}



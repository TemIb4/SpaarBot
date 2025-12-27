/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Наша Deep Black палитра
        black: '#000000',
        neutral: {
          900: '#121212', // Surface
          800: '#1E1E1E', // Secondary Surface
          700: '#2C2C2C', // Border
          500: '#737373', // Text Secondary
          400: '#A3A3A3', // Icon default
        },
        // Неоновые акценты
        primary: {
          400: '#818cf8', // Indigo Light
          500: '#6366f1', // Indigo Main
          600: '#4f46e5', // Indigo Dark
        },
        accent: {
          400: '#f472b6', // Pink Light
          500: '#ec4899', // Pink Main
        },
        success: {
          400: '#34d399', // Emerald Light
          500: '#10b981', // Emerald Main
        },
        danger: {
          400: '#fb7185', // Rose Light
          500: '#f43f5e', // Rose Main
        },
        warning: {
          400: '#fbbf24', // Amber
          500: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'nav': '0 -4px 20px rgba(0,0,0,0.2)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
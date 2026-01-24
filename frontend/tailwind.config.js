/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Định nghĩa màu chủ đạo (Emerald là màu xanh ngọc/lá tươi rất hợp)
        primary: {
          DEFAULT: '#10b981', // emerald-500
          dark: '#059669',    // emerald-600
        }
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(180deg)' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        }
      },
      animation: {
        float: 'float 20s infinite ease-in-out',
        slideUp: 'slideUp 0.5s ease-out',
        shake: 'shake 0.5s ease-in-out',
      }
    },
  },
  plugins: [],
}

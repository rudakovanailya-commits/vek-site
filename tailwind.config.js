/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#151A21',
          900: '#1F2933',
          850: '#202A35',
          800: '#202A35',
          700: '#2A3542',
          600: '#3D4956',
        },
        steel: {
          50: '#F7F8FA',
          100: '#F3F5F7',
          150: '#E8EDF3',
          200: '#DDE3EA',
          300: '#C0C7D0',
          400: '#8B939E',
          500: '#6B7380',
        },
        accent: {
          DEFAULT: '#1E5AA8',
          hover: '#174985',
          light: '#2B6BC4',
          muted: '#E8EDF3',
        },
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      maxWidth: {
        container: '72rem',
      },
      boxShadow: {
        card: '0 6px 18px rgba(21, 26, 33, 0.045)',
        'card-hover': '0 10px 24px rgba(30, 90, 168, 0.08)',
      },
    },
  },
  plugins: [],
}

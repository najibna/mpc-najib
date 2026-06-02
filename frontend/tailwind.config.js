/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        intact: {
          DEFAULT: "#D30C2C",
          dark: "#B00A24",
          light: "#E8334F",
          muted: "#FCE8EC",
        },
        cream: {
          DEFAULT: "#FDFBF7",
          50: "#FDFBF7",
          100: "#F5F1EA",
          200: "#EBE5DC",
        },
        charcoal: {
          DEFAULT: "#1A1A1A",
          muted: "#4A4A4A",
          light: "#6B6B6B",
        },
        ink: {
          900: "#FDFBF7",
          800: "#F5F1EA",
          700: "#EBE5DC",
          600: "#E0DAD2",
          500: "#D4CEC4",
        },
        royal: {
          600: "#D30C2C",
          500: "#D30C2C",
          400: "#E8334F",
        },
        mist: {
          100: "#1A1A1A",
          200: "#2D2D2D",
          300: "#4A4A4A",
          400: "#6B6B6B",
          500: "#8A8A8A",
        },
      },
      fontFamily: {
        sans: [
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          '"Playfair Display"',
          "Georgia",
          "Cambria",
          '"Times New Roman"',
          "serif",
        ],
      },
      borderRadius: {
        intact: "1.75rem",
        "intact-lg": "2rem",
      },
      boxShadow: {
        intact: "0 4px 32px -8px rgba(211, 12, 44, 0.18)",
        "intact-sm": "0 2px 16px -4px rgba(26, 26, 26, 0.08)",
        card: "0 2px 24px -6px rgba(26, 26, 26, 0.1)",
        "card-hover": "0 8px 40px -8px rgba(26, 26, 26, 0.14)",
        glow: "0 4px 24px -4px rgba(211, 12, 44, 0.2)",
        "glow-sm": "0 2px 12px -2px rgba(211, 12, 44, 0.15)",
      },
      backgroundImage: {
        "intact-gradient": "linear-gradient(135deg, #D30C2C 0%, #B00A24 100%)",
        "hero-gradient": "linear-gradient(180deg, #FDFBF7 0%, #F5F1EA 100%)",
        "royal-gradient": "linear-gradient(135deg, #D30C2C 0%, #B00A24 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

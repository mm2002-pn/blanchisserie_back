/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paper — fonds
        paper: {
          DEFAULT: '#FFFFFF',
          2: '#F1F3F7',
          3: '#EDEFF3',
        },
        // Ink — texte, bordures (échelle marine/gris)
        ink: {
          50: '#FAFBFC',
          100: '#F1F3F7',
          200: '#EDEFF3',
          300: '#DDE2EA',
          400: '#AFBDD1',
          500: '#8B97A8',
          600: '#4A5768',
          700: '#2E4066',
          800: '#17356B',
          900: '#0B1A2E',
        },
        // Brand — marine (identité principale)
        brand: {
          50: '#EDF1F7',
          100: '#D7E1F0',
          500: '#2C5A9E',
          600: '#1E3E70',
          700: '#17356B',
          800: '#0F2549',
          900: '#0B1A2E',
        },
        // Terra — terracotta (accent secondaire, CTA)
        terra: {
          100: '#FCEBD9',
          500: '#F0A03D',
          600: '#DE6B0E',
          700: '#B3540A',
        },
        // Baobab — vert (alias succès, conservé pour compat)
        baobab: {
          100: '#E4F3E9',
          600: '#2C7A4B',
          700: '#215C38',
        },
        // Sémantiques
        ok: {
          100: '#E4F3E9',
          600: '#2C7A4B',
          700: '#215C38',
        },
        warn: {
          100: '#FCEBD9',
          600: '#F0A03D',
          700: '#B3540A',
        },
        danger: {
          100: '#FBEAE5',
          600: '#C1441F',
        },
        // Alias historiques pour ne pas casser les écrans existants
        primary: {
          50: '#EDF1F7',
          100: '#D7E1F0',
          500: '#2C5A9E',
          600: '#1E3E70',
          700: '#17356B',
          800: '#0F2549',
          900: '#0B1A2E',
        },
        accent: {
          50: '#FCEBD9',
          100: '#FCEBD9',
          200: '#F8D9B8',
          300: '#F4C093',
          400: '#F0A03D',
          500: '#DE6B0E',
          600: '#DE6B0E',
          700: '#B3540A',
          800: '#8A3F07',
          900: '#662E05',
        },
        success: {
          DEFAULT: '#2C7A4B',
          light: '#E4F3E9',
          dark: '#215C38',
        },
        warning: {
          DEFAULT: '#F0A03D',
          light: '#FCEBD9',
          dark: '#B3540A',
        },
        error: {
          DEFAULT: '#C1441F',
          light: '#FBEAE5',
          dark: '#8A2F14',
        },
        info: {
          DEFAULT: '#2C5A9E',
          light: '#D7E1F0',
          dark: '#17356B',
        },
      },
      fontFamily: {
        // Display / titres / labels UI (Outfit)
        serif: ['Outfit', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
        // Corps de texte
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        // Numériques tabulaires — pas de mono dédiée dans la maquette, Outfit a de bons chiffres tabulaires
        mono: ['Outfit', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        micro: ['10px', { lineHeight: '1.2' }],
        tiny: ['11px', { lineHeight: '1.4' }],
      },
      letterSpacing: {
        caps: '0.16em',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11, 26, 46, 0.04)',
        medium: '0 2px 8px rgba(11, 26, 46, 0.06)',
        strong: '0 8px 24px rgba(11, 26, 46, 0.10)',
        card: 'none',
      },
      borderRadius: {
        card: '4px',
        input: '0px',
        pill: '999px',
      },
      borderWidth: {
        hairline: '1px',
      },
    },
  },
  plugins: [],
};

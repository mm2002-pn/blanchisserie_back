/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paper — fonds chauds
        paper: {
          DEFAULT: '#FCFBF9',
          2: '#F6F4F0',
          3: '#F1EEE9',
        },
        // Ink — texte, bordures
        ink: {
          50: '#FDFCFB',
          100: '#F2EFEB',
          200: '#E4E0DA',
          300: '#CDC8BF',
          400: '#A39E93',
          500: '#807A6F',
          600: '#5E584F',
          700: '#423D35',
          800: '#2A2620',
          900: '#1A1712',
        },
        // Brand — bleu boubou (hue 244)
        brand: {
          50: '#F1F3FA',
          100: '#DDE2F0',
          500: '#6A80CC',
          600: '#4A62BC',
          700: '#394E9A',
          800: '#2C3C79',
          900: '#1D2853',
        },
        // Terra — terre de Casamance (hue 38)
        terra: {
          100: '#F5E4D7',
          600: '#CF7B4B',
          700: '#AA5B2A',
        },
        // Baobab — vert baobab (hue 135)
        baobab: {
          100: '#E0EEDB',
          600: '#629853',
          700: '#4A7A3E',
        },
        // Sémantiques
        ok: {
          100: '#DCEEE1',
          600: '#53A47C',
          700: '#3A825E',
        },
        warn: {
          100: '#F6EAD0',
          600: '#CA9A36',
          700: '#92671D',
        },
        danger: {
          100: '#F6E0DA',
          600: '#C3452B',
        },
        // Alias historiques pour ne pas casser les écrans existants
        primary: {
          50: '#F1F3FA',
          100: '#DDE2F0',
          500: '#6A80CC',
          600: '#4A62BC',
          700: '#394E9A',
          800: '#2C3C79',
          900: '#1D2853',
        },
        accent: {
          50: '#F5E4D7',
          100: '#F5E4D7',
          200: '#EBCBAE',
          300: '#E0B285',
          400: '#D6985E',
          500: '#CF7B4B',
          600: '#CF7B4B',
          700: '#AA5B2A',
          800: '#8A4820',
          900: '#6A3817',
        },
        success: {
          DEFAULT: '#53A47C',
          light: '#DCEEE1',
          dark: '#3A825E',
        },
        warning: {
          DEFAULT: '#CA9A36',
          light: '#F6EAD0',
          dark: '#92671D',
        },
        error: {
          DEFAULT: '#C3452B',
          light: '#F6E0DA',
          dark: '#8A2F1B',
        },
        info: {
          DEFAULT: '#6A80CC',
          light: '#DDE2F0',
          dark: '#2C3C79',
        },
      },
      fontFamily: {
        // Serif éditoriale (titres)
        serif: ['"Bricolage Grotesque"', 'Georgia', 'serif'],
        heading: ['"Bricolage Grotesque"', 'Georgia', 'serif'],
        // UI (corps, labels)
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        // Numériques tabulaires (kg, F CFA, codes)
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        micro: ['10px', { lineHeight: '1.2' }],
        tiny: ['11px', { lineHeight: '1.4' }],
      },
      letterSpacing: {
        caps: '0.08em',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(26, 23, 18, 0.04)',
        medium: '0 2px 8px rgba(26, 23, 18, 0.06)',
        strong: '0 8px 24px rgba(26, 23, 18, 0.10)',
        card: '0 1px 2px rgba(26, 23, 18, 0.04)',
      },
      borderRadius: {
        card: '14px',
        input: '10px',
        pill: '999px',
      },
      borderWidth: {
        hairline: '0.5px',
      },
    },
  },
  plugins: [],
};

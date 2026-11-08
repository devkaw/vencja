import type { Config } from "tailwindcss";
import containerQueries from "@tailwindcss/container-queries";

// Semantic colors are CSS variables (see globals.css) so light/dark swap without
// touching markup. Values are "R G B" triplets to keep Tailwind's /<alpha> modifiers.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const brand = {
  50: '#F1F9F6',
  100: '#DBF0E8',
  200: '#AFDECD',
  300: '#70C2A4',
  400: '#339974',
  500: '#0F7550',
  600: '#0A5F40',
  700: '#084D33',
  800: '#063A27',
  900: '#052C1D',
  950: '#021A11',
};

const amber = {
  50: '#FFF8EB',
  100: '#FEEDC7',
  200: '#FDD98A',
  300: '#FCC04D',
  400: '#F9A824',
  500: '#E3890B',
  600: '#C06A06',
  700: '#9A4D09',
  800: '#7E3E0F',
  900: '#683410',
};

const coral = {
  50: '#FEF3F2',
  100: '#FEE4E2',
  200: '#FECDCA',
  300: '#FCA5A0',
  400: '#F7726A',
  500: '#EE4A3F',
  600: '#D9302A',
  700: '#B52520',
  800: '#95221F',
  900: '#7B2220',
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/ui/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: v('canvas'),
        surface: {
          DEFAULT: v('surface'),
          2: v('surface-2'),
          3: v('surface-3'),
          light: '#FFFFFF',
          dark: '#0B1210',
          elevated: v('surface'),
        },
        ink: {
          DEFAULT: v('ink'),
          2: v('ink-2'),
          3: v('ink-3'),
          4: v('ink-4'),
        },
        line: {
          DEFAULT: v('line'),
          strong: v('line-strong'),
        },
        brand: { ...brand, DEFAULT: brand[600], fg: v('brand-fg'), ink: v('brand-ink'), soft: v('brand-soft') },
        pos: { DEFAULT: v('pos'), soft: v('pos-soft') },
        warn: { DEFAULT: v('warn'), soft: v('warn-soft') },
        neg: { DEFAULT: v('neg'), soft: v('neg-soft') },
        info: { DEFAULT: v('info'), soft: v('info-soft') },
        // Legacy scales kept so older markup (legal pages, emails) still maps onto the new palette.
        primary: { ...brand, DEFAULT: brand[600] },
        accent: { ...brand, DEFAULT: brand[500] },
        success: { ...brand, DEFAULT: brand[500] },
        warning: { ...amber, DEFAULT: amber[500] },
        danger: { ...coral, DEFAULT: coral[500] },
        amber,
        coral,
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-geist)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-2xl': ['clamp(2.6rem, 6.2vw, 4.75rem)', { lineHeight: '0.98', letterSpacing: '-0.035em' }],
        'display-xl': ['clamp(2.1rem, 4.4vw, 3.4rem)', { lineHeight: '1.04', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(1.75rem, 3.2vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'display-md': ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-sm': ['1.375rem', { lineHeight: '1.25', letterSpacing: '-0.015em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'xs': '0 1px 2px rgb(var(--shadow) / 0.06)',
        'card': '0 1px 2px rgb(var(--shadow) / 0.05), 0 4px 16px -6px rgb(var(--shadow) / 0.08)',
        'lift': '0 2px 4px rgb(var(--shadow) / 0.05), 0 16px 40px -12px rgb(var(--shadow) / 0.18)',
        'float': '0 24px 60px -18px rgb(var(--shadow) / 0.35), 0 8px 20px -10px rgb(var(--shadow) / 0.18)',
        'brand': '0 1px 0 rgb(255 255 255 / 0.25) inset, 0 8px 22px -8px rgb(7 74 49 / 0.6)',
        'ring-brand': '0 0 0 4px rgb(15 118 80 / 0.2)',
        // Legacy names
        'soft': '0 2px 20px rgb(var(--shadow) / 0.06)',
        'soft-md': '0 4px 30px rgb(var(--shadow) / 0.08)',
        'glow': '0 0 40px rgb(15 118 80 / 0.28)',
        'glow-lg': '0 0 60px rgb(15 118 80 / 0.38)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-down': 'fadeDown 0.4s ease-out both',
        'slide-in': 'fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-left': 'slideInLeft 0.3s ease-out both',
        'slide-in-right': 'slideInRight 0.3s ease-out both',
        'scale-in': 'scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'sheet-up': 'sheetUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer': 'shimmer 1.8s linear infinite',
        'float': 'float 7s ease-in-out infinite',
        'float-slow': 'float 11s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'ping-slow': 'ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'marquee': 'marquee 38s linear infinite',
        'drift': 'drift 22s ease-in-out infinite',
        'spin-slow': 'spin-slow 60s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeDown: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { '0%': { opacity: '0', transform: 'translateX(-16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        sheetUp: { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
        drift: { '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' }, '33%': { transform: 'translate3d(3%,2%,0) scale(1.06)' }, '66%': { transform: 'translate3d(-2%,3%,0) scale(0.97)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [containerQueries],
};

export default config;

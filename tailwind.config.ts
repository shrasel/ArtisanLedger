import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#111215',
          light: '#1A1C20',
          border: '#27292E',
        },
        paper: {
          DEFAULT: '#FAF8F5',
          pure: '#FFFFFF',
          dark: '#F3EFEA',
          aged: '#ECE6DC',
        },
        bone: {
          DEFAULT: '#E6E1D9',
          dark: '#D5CFC5',
        },
        ink: {
          DEFAULT: '#18191B',
          primary: '#18191B',
          secondary: '#5C5E62',
          ghost: '#A1A3A8',
        },
        status: {
          vermilion: '#C84630',
          hunter: '#2B4C3F',
          brass: '#D4AF37',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'Cambria', 'serif'],
        mono: ['Geist Mono', 'IBM Plex Mono', 'Courier New', 'monospace'],
        sans: ['Geist Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        paper: '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(230, 225, 217, 0.25)',
        sheet: '0 20px 45px -10px rgba(0, 0, 0, 0.6), 0 2px 10px 0 rgba(0, 0, 0, 0.2)',
        stamp: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;


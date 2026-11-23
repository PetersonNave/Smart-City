// NativeWind v4 (Tailwind CSS v3). Cores e fontes vêm de src/theme/tokens.json, a mesma
// fonte usada pelo tema TypeScript (src/theme): não há valores duplicados entre os dois.
const tokens = require('./src/theme/tokens.json');

const { inter, sourceSans3, jetBrainsMono } = tokens.fonts;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // bg-primary, text-navy, bg-dangerSoft, border-border, text-textMuted...
      colors: { ...tokens.colors, ...tokens.palette },
      // No React Native o peso vem do arquivo da fonte: cada peso é uma família.
      fontFamily: {
        inter: [inter.regular],
        'inter-medium': [inter.medium],
        'inter-semibold': [inter.semiBold],
        'inter-bold': [inter.bold],
        'inter-extrabold': [inter.extraBold],
        source: [sourceSans3.regular],
        'source-semibold': [sourceSans3.semiBold],
        'source-extrabold': [sourceSans3.extraBold],
        mono: [jetBrainsMono.regular],
        'mono-extrabold': [jetBrainsMono.extraBold],
      },
      borderRadius: {
        card: '20px',
        field: '15px',
      },
    },
  },
  plugins: [],
};

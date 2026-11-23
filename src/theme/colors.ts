import tokens from './tokens.json';

// Fonte única das cores: `tokens.json` (paleta do Figma, frame "Cores"). O mesmo arquivo
// alimenta o tailwind.config.js, então as classes NativeWind e o StyleSheet usam os mesmos valores.
export const colors = tokens.colors;

export type ColorToken = keyof typeof colors;

// Neutros e cores de estado usados nas telas do Figma (não são cores de marca).
export const palette = tokens.palette;

// Aplica transparência a uma cor hex (#RRGGBB) — os gradientes do Figma usam 90% de opacidade.
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

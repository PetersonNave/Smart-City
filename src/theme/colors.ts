// Paleta oficial definida no Figma (frame "Cores").
export const colors = {
  primary: '#329D9C',
  secondary: '#56C596',
  navy: '#205072',
} as const;

export type ColorToken = keyof typeof colors;

// Neutros e cores de estado usados nas telas do Figma (não são cores de marca).
export const palette = {
  white: '#FFFFFF',
  text: '#1C2D42',
  textStrong: '#1E1E1E',
  textMuted: '#5A6E85',
  textSubtle: '#90A4AE',
  textPlaceholder: '#757575',
  border: '#E8ECF0',
  inputBackground: '#F4F4F4',
  inputPlaceholder: '#BBBBBB',
  inputIcon: '#79747E',
  authSheet: '#DEDEDE',
  surfaceMuted: '#F5F6F8',
  shadow: '#1C2D42',
  danger: '#EF5350',
  dangerStrong: '#DC2626',
  dangerBorder: '#FF383C',
  dangerSoft: 'rgba(239, 83, 80, 0.1)',
  warning: '#FFB300',
  warningStrong: '#F59E0B',
  warningSoft: '#FFF4E5',
  info: '#205072',
  infoSoft: '#E0F2F1',
  success: '#56C596',
  successStrong: '#2E7D32',
  successSoft: '#E8F5E9',
  successIconSoft: 'rgba(46, 158, 91, 0.1)',
  headerButton: 'rgba(255, 255, 255, 0.15)',
  overlay: 'rgba(28, 45, 66, 0.45)',
} as const;

// Aplica transparência a uma cor hex (#RRGGBB) — os gradientes do Figma usam 90% de opacidade.
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

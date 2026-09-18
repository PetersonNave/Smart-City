// Paleta oficial definida no Figma (frame "Cores").
export const colors = {
  primary: '#329D9C',
  secondary: '#56C596',
  navy: '#205072',
} as const;

export type ColorToken = keyof typeof colors;

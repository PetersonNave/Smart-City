// Importa cada peso pelo subcaminho: importar da raiz do pacote empacota TODOS os pesos
// (dezenas de .ttf) no bundle, mesmo os que o app não usa.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { SourceSans3_400Regular } from '@expo-google-fonts/source-sans-3/400Regular';
import { SourceSans3_600SemiBold } from '@expo-google-fonts/source-sans-3/600SemiBold';
import { SourceSans3_800ExtraBold } from '@expo-google-fonts/source-sans-3/800ExtraBold';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_800ExtraBold } from '@expo-google-fonts/jetbrains-mono/800ExtraBold';

// Famílias definidas no Figma (frame "Tipografia"), a passar para useFonts().
export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
  SourceSans3_800ExtraBold,
  JetBrainsMono_400Regular,
  JetBrainsMono_800ExtraBold,
};

export const fonts = {
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extraBold: 'Inter_800ExtraBold',
  },
  sourceSans3: {
    regular: 'SourceSans3_400Regular',
    semiBold: 'SourceSans3_600SemiBold',
    extraBold: 'SourceSans3_800ExtraBold',
  },
  jetBrainsMono: {
    regular: 'JetBrainsMono_400Regular',
    extraBold: 'JetBrainsMono_800ExtraBold',
  },
} as const;

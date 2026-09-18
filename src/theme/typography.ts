import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  SourceSans3_400Regular,
  SourceSans3_800ExtraBold,
} from '@expo-google-fonts/source-sans-3';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_800ExtraBold,
} from '@expo-google-fonts/jetbrains-mono';

// Famílias definidas no Figma (frame "Tipografia"), a passar para useFonts().
export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  SourceSans3_400Regular,
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
    extraBold: 'SourceSans3_800ExtraBold',
  },
  jetBrainsMono: {
    regular: 'JetBrainsMono_400Regular',
    extraBold: 'JetBrainsMono_800ExtraBold',
  },
} as const;

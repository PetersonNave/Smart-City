import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { fonts, palette } from '../../theme';
import { Icon } from '../Icon';

export type OfflineBannerProps = {
  /** Quando os dados exibidos foram salvos (ISO). Sem valor, mostra só o aviso. */
  savedAt?: string | null;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function formatSavedAt(savedAt: string) {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Aviso discreto (mesmo tom âmbar do Toast de warning) quando a tela mostra dados do cache local.
export function OfflineBanner({ savedAt, style, testID = 'offline-banner' }: OfflineBannerProps) {
  const when = savedAt ? formatSavedAt(savedAt) : null;
  return (
    <View style={[styles.banner, style]} testID={testID} accessibilityRole="alert">
      <View style={styles.icon}>
        <Icon name="alert" size={10} color={palette.white} strokeWidth={3} />
      </View>
      <Text style={styles.text}>
        Sem conexão. Mostrando dados salvos{when ? ` em ${when}` : ''}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.warningSoft,
  },
  icon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.warningStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontFamily: fonts.inter.bold,
    fontSize: 13,
    color: palette.warningText,
  },
});

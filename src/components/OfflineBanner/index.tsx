import { Text, View } from 'react-native';
import { palette } from '../../theme';
import { Icon } from '../Icon';

export type OfflineBannerProps = {
  /** Quando os dados exibidos foram salvos (ISO). Sem valor, mostra só o aviso. */
  savedAt?: string | null;
  className?: string;
  testID?: string;
};

function formatSavedAt(savedAt: string) {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Aviso discreto (mesmo tom âmbar do Toast de warning) quando a tela mostra dados do cache local.
export function OfflineBanner({ savedAt, className = '', testID = 'offline-banner' }: OfflineBannerProps) {
  const when = savedAt ? formatSavedAt(savedAt) : null;
  return (
    <View
      className={`flex-row items-center gap-2.5 rounded-xl border border-warningStrong/30 bg-warningSoft px-4 py-2.5 ${className}`}
      testID={testID}
      accessibilityRole="alert"
    >
      <View className="h-[18px] w-[18px] items-center justify-center rounded-full bg-warningStrong">
        <Icon name="alert" size={10} color={palette.white} strokeWidth={3} />
      </View>
      <Text className="flex-1 font-inter-bold text-[13px] text-warningText">
        Sem conexão. Mostrando dados salvos{when ? ` em ${when}` : ''}.
      </Text>
    </View>
  );
}

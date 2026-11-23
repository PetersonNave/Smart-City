import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '../../components/GradientBackground';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme';

// Abas ainda não implementadas (ex.: Mapa): avisa e aponta para o que já funciona.
export function PlaceholderScreen({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <GradientBackground variant="screen" style={{ paddingTop: insets.top }}>
      <ScreenHeader title={title} testID="placeholder-header" />
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full items-center gap-3 rounded-card bg-white p-6 shadow-md">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-infoSoft">
            <Icon name="map" size={30} color={colors.primary} />
          </View>
          <Text className="font-inter-extrabold text-lg text-navy">Em construção</Text>
          <Text className="text-center font-inter-medium text-sm leading-5 text-textMuted">
            Em breve você verá as demandas no mapa da cidade. Enquanto isso, acompanhe tudo pela aba Demandas.
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
}

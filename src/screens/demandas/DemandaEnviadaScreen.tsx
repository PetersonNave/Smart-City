import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { GradientBackground } from '../../components/GradientBackground';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { STATUS_META, formatarProtocolo } from '../../domain/demanda';
import type { AppStackScreenProps } from '../../navigation/types';
import { fonts, palette } from '../../theme';

type Props = AppStackScreenProps<'DemandaEnviada'>;

// Figma "Demanda enviada".
export function DemandaEnviadaScreen({ navigation, route }: Props) {
  const { demanda } = route.params;
  const insets = useSafeAreaInsets();
  const status = STATUS_META[demanda.status];

  const goHome = () => navigation.navigate('Tabs', { screen: 'Inicio' });
  const followDemand = () =>
    navigation.navigate('Tabs', {
      screen: 'Demandas',
      // initial: false mantém a lista embaixo do detalhe, pro "voltar" funcionar.
      params: { screen: 'DemandaDetalhe', params: { id: demanda.id }, initial: false },
    });

  return (
    <GradientBackground variant="screen" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Demanda enviada" variant="plain" onBack={goHome} testID="enviada-header" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name="check" size={36} color={palette.successStrong} strokeWidth={2.5} />
          </View>
          <View style={styles.texts}>
            <Text style={styles.title} accessibilityRole="header">
              Demanda registrada com sucesso!
            </Text>
            <Text style={styles.subtitle}>Acompanhe o status pelo número de protocolo:</Text>
          </View>
          <View style={styles.protocolCard}>
            <Text style={styles.protocol} testID="enviada-protocolo" selectable>
              {formatarProtocolo(demanda)}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status inicial:</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{status.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label="Acompanhar demanda"
            variant="surface"
            onPress={followDemand}
            testID="enviada-acompanhar"
          />
          <Button label="Voltar ao início" variant="surface" onPress={goHome} testID="enviada-inicio" />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 27,
    paddingTop: 36,
    gap: 32,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 24,
    padding: 32,
    gap: 24,
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.successIconSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 22,
    color: palette.textStrong,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.inter.medium,
    fontSize: 15,
    lineHeight: 20,
    color: palette.textPlaceholder,
    textAlign: 'center',
  },
  protocolCard: {
    width: '100%',
    backgroundColor: palette.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  protocol: {
    fontFamily: fonts.jetBrainsMono.extraBold,
    fontSize: 22,
    color: palette.textStrong,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 15,
    color: palette.textPlaceholder,
  },
  statusPill: {
    backgroundColor: palette.warningStrong,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusPillText: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 14,
    color: palette.white,
  },
  actions: {
    gap: 12,
  },
});

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { obterDemanda, type Demanda } from '../../api/demandas';
import { Button } from '../../components/Button';
import { GradientBackground } from '../../components/GradientBackground';
import { Icon } from '../../components/Icon';
import { Loading } from '../../components/Loading';
import { ScreenHeader } from '../../components/ScreenHeader';
import { STATUS_META, formatarProtocolo } from '../../domain/demanda';
import { paramValue, parseIdParam, routes } from '../../navigation/routes';
import { fonts, palette } from '../../theme';

// Figma "Demanda enviada". Recebe só o id pela URL e busca a demanda (protocolo e status).
export function DemandaEnviadaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; fotoPendente?: string }>();
  const id = parseIdParam(params.id);
  const fotoPendente = paramValue(params.fotoPendente) === '1';
  const insets = useSafeAreaInsets();
  const [demanda, setDemanda] = useState<Demanda | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Demanda não encontrada.');
      return;
    }
    setError(null);
    try {
      setDemanda(await obterDemanda(id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a demanda.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const status = STATUS_META[demanda?.status ?? 'PENDING'];
  // dismissTo tira esta tela da pilha (não dá para "voltar" para a confirmação).
  const goHome = () => router.dismissTo(routes.inicio);
  // O layout de demandas coloca a lista embaixo do detalhe, então o "voltar" leva à lista.
  const followDemand = () => id && router.dismissTo(routes.demanda(id));

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
            {demanda ? (
              <Text style={styles.protocol} testID="enviada-protocolo" selectable>
                {formatarProtocolo(demanda)}
              </Text>
            ) : error ? (
              <Text style={styles.protocolError} testID="enviada-erro" onPress={load}>
                {error} Toque para tentar de novo.
              </Text>
            ) : (
              <Loading size="small" testID="enviada-carregando" />
            )}
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status inicial:</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{status.label}</Text>
            </View>
          </View>
          {fotoPendente && (
            <View style={styles.photoWarning} testID="enviada-foto-pendente" accessibilityRole="alert">
              <Icon name="alert" size={18} color={palette.warningText} />
              <Text style={styles.photoWarningText}>
                A foto não pôde ser enviada. Você pode adicioná-la depois em "Editar Demanda".
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            label="Acompanhar demanda"
            variant="surface"
            onPress={followDemand}
            disabled={!id}
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
  protocolError: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: palette.danger,
    textAlign: 'center',
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
  photoWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.warningSoft,
  },
  photoWarningText: {
    flex: 1,
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: palette.warningText,
  },
  actions: {
    gap: 12,
  },
});

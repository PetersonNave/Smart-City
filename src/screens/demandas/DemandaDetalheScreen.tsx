import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { obterDemanda, type Demanda } from '../../api/demandas';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { DemandThumb } from '../../components/DemandThumb';
import { GradientBackground } from '../../components/GradientBackground';
import { Icon } from '../../components/Icon';
import { Loading } from '../../components/Loading';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useTabBarInset } from '../../components/TabBar';
import { Toast } from '../../components/Toast';
import { CATEGORIA_LABELS, STATUS_META, formatarData, formatarProtocolo, podeEditar } from '../../domain/demanda';
import type { DemandasStackScreenProps } from '../../navigation/types';
import { colors, fonts, palette } from '../../theme';

type Props = DemandasStackScreenProps<'DemandaDetalhe'>;

// Figma "Detalhe da Demanda" e o estado após editar ("Demanda atualizada com sucesso!").
export function DemandaDetalheScreen({ navigation, route }: Props) {
  const { id, feedback } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const [demanda, setDemanda] = useState<Demanda | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'warning' } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDemanda(await obterDemanda(id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a demanda.');
    }
  }, [id]);

  // `feedback.at` muda a cada edição salva: recarrega e mostra o resultado.
  useEffect(() => {
    load();
  }, [load, feedback?.at]);

  useEffect(() => {
    if (!feedback) return;
    setToast(
      feedback.fotoFalhou
        ? { message: 'Demanda atualizada, mas a foto não pôde ser enviada.', tone: 'warning' }
        : { message: 'Demanda atualizada com sucesso!', tone: 'success' }
    );
  }, [feedback]);

  const hideToast = useCallback(() => setToast(null), []);

  // O gestor pode mudar o status a qualquer momento: puxar para baixo busca a versão atual.
  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      setDemanda(await obterDemanda(id));
    } catch {
      // Mantém os dados já exibidos; o erro de rede não deve apagar a tela.
    } finally {
      setIsRefreshing(false);
    }
  }

  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('DemandasLista'));

  return (
    <GradientBackground variant="screen" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Detalhe da Demanda" onBack={goBack} testID="detalhe-header" />

      <View style={styles.feedback}>
        <Toast message={toast?.message ?? null} tone={toast?.tone} onHide={hideToast} testID="detalhe-toast" />
      </View>

      {!demanda && !error && (
        <View style={styles.centered}>
          <Loading color={palette.white} testID="detalhe-loading" />
        </View>
      )}

      {error && (
        <View style={[styles.centered, styles.padded]} testID="detalhe-error">
          <Text style={styles.errorText}>{error}</Text>
          <Button label="Tentar novamente" variant="surface" onPress={load} testID="detalhe-retry" />
        </View>
      )}

      {demanda && !error && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 24 }]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={palette.white} />
          }
          testID="detalhe-scroll"
        >
          <View style={styles.card} testID="detalhe-card">
            <View style={styles.titleRow}>
              <Text style={styles.title}>{demanda.title}</Text>
              <StatusBadge status={demanda.status} size="md" />
            </View>

            <DemandThumb
              category={demanda.category}
              photoUrl={demanda.photoUrl}
              iconSize={56}
              style={styles.photo}
              testID="detalhe-foto"
            />

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Descrição</Text>
              <Text style={styles.description}>{demanda.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {feedback?.localizacaoAtualizada ? 'Localização (atualizada)' : 'Localização'}
              </Text>
              <View style={styles.locationRow}>
                <Icon name="map" size={14} color={colors.primary} />
                <Text style={styles.location}>{demanda.location}</Text>
              </View>
            </View>

            <View style={styles.rows}>
              <InfoRow label="Protocolo" value={formatarProtocolo(demanda)} />
              <InfoRow label="Categoria" value={CATEGORIA_LABELS[demanda.category]} />
              <InfoRow label="Data de registro" value={formatarData(demanda.createdAt)} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Status atual</Text>
                <View style={styles.statusValue}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_META[demanda.status].color }]} />
                  <Text style={[styles.rowValue, { color: STATUS_META[demanda.status].color }]}>
                    {STATUS_META[demanda.status].label.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {podeEditar(demanda, user) && (
            <Button
              label="Editar Demanda"
              icon="pencil"
              variant="outline"
              radius={15}
              onPress={() => navigation.navigate('EditarDemanda', { id: demanda.id })}
              style={styles.editButton}
              testID="detalhe-editar"
            />
          )}
        </ScrollView>
      )}
    </GradientBackground>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  padded: {
    paddingHorizontal: 32,
  },
  errorText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 15,
    color: palette.white,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: fonts.inter.bold,
    fontSize: 20,
    color: palette.text,
  },
  photo: {
    width: '100%',
    height: 180,
  },
  feedback: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  editButton: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  description: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  location: {
    flex: 1,
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: palette.text,
  },
  rows: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    fontFamily: fonts.inter.medium,
    fontSize: 13,
    color: palette.textMuted,
  },
  rowValue: {
    fontFamily: fonts.inter.bold,
    fontSize: 13,
    color: palette.text,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

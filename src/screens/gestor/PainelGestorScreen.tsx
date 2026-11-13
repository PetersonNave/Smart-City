import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { obterMetricas, type MetricasPainel } from '../../api/metricas';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { GradientBackground } from '../../components/GradientBackground';
import { Loading } from '../../components/Loading';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTabBarInset } from '../../components/TabBar';
import {
  CATEGORIA_OPTIONS,
  REGIAO_OPTIONS,
  STATUS_META,
  STATUS_ORDEM,
  formatarDuracaoHoras,
} from '../../domain/demanda';
import { routes } from '../../navigation/routes';
import { colors, fonts, palette } from '../../theme';

type Barra = { key: string; label: string; value: number; color: string };

// Painel do Gestor Público: indicadores operacionais vindos de GET /api/demandas/metricas
// (rota protegida no backend pelo perfil gestor).
export function PainelGestorScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const [metricas, setMetricas] = useState<MetricasPainel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setMetricas(await obterMetricas());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os indicadores.');
    }
  }, []);

  // Os números mudam a cada status alterado: recarrega sempre que o painel volta ao foco.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  return (
    <GradientBackground variant="screen" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Painel do Gestor" testID="painel-header" />

      {!metricas && !error && (
        <View style={styles.centered}>
          <Loading color={palette.white} testID="painel-loading" />
        </View>
      )}

      {!metricas && error && (
        <View style={[styles.centered, styles.padded]} testID="painel-error">
          <Text style={styles.errorText}>{error}</Text>
          <Button label="Tentar novamente" variant="surface" onPress={load} testID="painel-retry" />
        </View>
      )}

      {metricas && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 24 }]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={palette.white} />}
          testID="painel-scroll"
        >
          <Text style={styles.greeting}>Olá, {user?.name ?? 'gestor'}!</Text>
          {error && <Text style={styles.inlineError}>{error}</Text>}

          <View style={styles.kpis}>
            <Kpi label="Total de demandas" value={String(metricas.total)} testID="painel-total" wide />
            {STATUS_ORDEM.map((status) => (
              <Kpi
                key={status}
                label={STATUS_META[status].label}
                value={String(metricas.por_status[status] ?? 0)}
                color={STATUS_META[status].color}
                testID={`painel-status-${status}`}
              />
            ))}
          </View>

          <View style={styles.card} testID="painel-tempo-medio">
            <Text style={styles.cardTitle}>Tempo médio de atendimento</Text>
            <Text style={styles.bigValue}>{formatarDuracaoHoras(metricas.tempo_medio_atendimento_horas)}</Text>
            <Text style={styles.cardHint}>
              {metricas.atendidas > 0
                ? `Do registro à conclusão/recusa, em ${metricas.atendidas} demanda(s) atendida(s). Taxa de resolução: ${Math.round(metricas.taxa_resolucao * 100)}%.`
                : 'Nenhuma demanda foi concluída ou recusada ainda.'}
            </Text>
          </View>

          <Distribuicao
            title="Por categoria"
            testID="painel-categorias"
            barras={CATEGORIA_OPTIONS.map(({ value: categoria, label }) => ({
              key: categoria,
              label,
              value: metricas.por_categoria[categoria] ?? 0,
              color: colors.primary,
            }))}
          />

          <Distribuicao
            title="Por região"
            testID="painel-regioes"
            barras={[
              ...REGIAO_OPTIONS.map(({ value: regiao, label }) => ({
                key: regiao,
                label,
                value: metricas.por_regiao[regiao] ?? 0,
                color: colors.navy,
              })),
              { key: 'NAO_INFORMADA', label: 'Não informada', value: metricas.por_regiao.NAO_INFORMADA ?? 0, color: palette.textSubtle },
            ]}
          />

          <Button
            label="Analisar demandas"
            variant="surface"
            onPress={() => router.push(routes.demandas)}
            testID="painel-analisar"
          />
        </ScrollView>
      )}
    </GradientBackground>
  );
}

function Kpi({
  label,
  value,
  color = colors.navy,
  wide,
  testID,
}: {
  label: string;
  value: string;
  color?: string;
  wide?: boolean;
  testID?: string;
}) {
  return (
    <View style={[styles.kpi, wide && styles.kpiWide]} testID={testID}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Distribuicao({ title, barras, testID }: { title: string; barras: Barra[]; testID?: string }) {
  const max = Math.max(1, ...barras.map((barra) => barra.value));
  return (
    <View style={styles.card} testID={testID}>
      <Text style={styles.cardTitle}>{title}</Text>
      {barras.map((barra) => (
        <View key={barra.key} style={styles.barRow} accessible accessibilityLabel={`${barra.label}: ${barra.value}`}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>{barra.label}</Text>
            <Text style={styles.barValue}>{barra.value}</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${(barra.value / max) * 100}%`, backgroundColor: barra.color },
              ]}
            />
          </View>
        </View>
      ))}
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
  inlineError: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: palette.white,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  greeting: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 20,
    color: palette.white,
  },
  kpis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpi: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: palette.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 2,
  },
  kpiWide: {
    flexBasis: '100%',
  },
  kpiValue: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 26,
  },
  kpiLabel: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: palette.textMuted,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  cardTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  bigValue: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 28,
    color: colors.navy,
  },
  cardHint: {
    fontFamily: fonts.inter.medium,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textMuted,
  },
  barRow: {
    gap: 4,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontFamily: fonts.inter.medium,
    fontSize: 13,
    color: palette.text,
  },
  barValue: {
    fontFamily: fonts.inter.bold,
    fontSize: 13,
    color: palette.text,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.surfaceMuted,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
});

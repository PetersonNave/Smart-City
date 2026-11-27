import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { obterMetricas, type MetricasPainel } from '../../api/metricas';
import { useAuth } from '../../auth/AuthContext';
import { BarList } from '../../components/BarList';
import { Button } from '../../components/Button';
import { GradientBackground } from '../../components/GradientBackground';
import { Icon, type IconName } from '../../components/Icon';
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
import { colors, palette } from '../../theme';

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
        <View className="flex-1 items-center justify-center">
          <Loading color={palette.white} testID="painel-loading" />
        </View>
      )}

      {!metricas && error && (
        <View className="flex-1 items-center justify-center gap-3 px-8" testID="painel-error">
          <Text className="text-center font-inter-semibold text-[15px] text-white">{error}</Text>
          <Button label="Tentar novamente" variant="surface" onPress={load} testID="painel-retry" />
        </View>
      )}

      {metricas && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabBarInset + 24 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={palette.white} />}
          testID="painel-scroll"
        >
          <View className="gap-4 px-4">
          <View>
            <Text className="font-inter-extrabold text-xl text-white">Olá, {user?.name ?? 'gestor'}!</Text>
            <Text className="font-inter-medium text-[13px] text-white/80">Visão geral das demandas da cidade</Text>
          </View>
          {error && <Text className="text-center font-inter-semibold text-[13px] text-white">{error}</Text>}

          <View className="flex-row flex-wrap gap-3">
            <Kpi label="Total de demandas" value={String(metricas.total)} icon="demands" testID="painel-total" wide />
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

          <View className="gap-2 rounded-card bg-white p-5 shadow-md" testID="painel-tempo-medio">
            <View className="flex-row items-center justify-between">
              <Text className="font-inter-bold text-xs uppercase text-primary">Tempo médio de atendimento</Text>
              <View className="rounded-full bg-successSoft px-2.5 py-1">
                <Text className="font-inter-bold text-[11px] text-successStrong">
                  {Math.round(metricas.taxa_resolucao * 100)}% resolvidas
                </Text>
              </View>
            </View>
            <Text className="font-inter-extrabold text-3xl text-navy">{formatarDuracaoHoras(metricas.tempo_medio_atendimento_horas)}</Text>
            <Text className="font-inter-medium text-[13px] leading-[18px] text-textMuted">
              {metricas.atendidas > 0
                ? `Do registro à conclusão/recusa, em ${metricas.atendidas} demanda(s) atendida(s). Taxa de resolução: ${Math.round(metricas.taxa_resolucao * 100)}%.`
                : 'Nenhuma demanda foi concluída ou recusada ainda.'}
            </Text>
          </View>

          <BarList
            title="Por categoria"
            testID="painel-categorias"
            items={CATEGORIA_OPTIONS.map(({ value: categoria, label }) => ({
              key: categoria,
              label,
              value: metricas.por_categoria[categoria] ?? 0,
              color: colors.primary,
            }))}
          />

          <BarList
            title="Por região"
            testID="painel-regioes"
            items={[
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
          </View>
        </ScrollView>
      )}
    </GradientBackground>
  );
}

function Kpi({
  label,
  value,
  color = colors.navy,
  icon,
  wide,
  testID,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: IconName;
  wide?: boolean;
  testID?: string;
}) {
  return (
    <View
      className={`rounded-2xl bg-white px-4 py-3.5 shadow-sm ${wide ? 'w-full flex-row items-center gap-3' : 'min-w-[45%] flex-1'}`}
      testID={testID}
    >
      {icon && (
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-infoSoft">
          <Icon name={icon} size={22} color={colors.primary} />
        </View>
      )}
      <View>
        <Text className="font-inter-extrabold text-[26px]" style={{ color }}>
          {value}
        </Text>
        <Text className="font-inter-semibold text-[13px] text-textMuted">{label}</Text>
      </View>
    </View>
  );
}

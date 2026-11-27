import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { obterInsightsRecife, type InsightsRecife } from '../../api/insights';
import { BarList } from '../../components/BarList';
import { Button } from '../../components/Button';
import { DonutChart } from '../../components/DonutChart';
import { GradientBackground } from '../../components/GradientBackground';
import { Loading } from '../../components/Loading';
import { ScreenHeader } from '../../components/ScreenHeader';
import { routes } from '../../navigation/routes';
import { colors, palette } from '../../theme';

// Insights da cidade: dados abertos da Central 156 (EMLURB) que passaram pela pipeline de dados
// do grupo (etl-smart-city) e são lidos pelo backend no Neon. Réplica da aba "Panorama" do dashboard.

const RPAS: { rpa: number; nome: string }[] = [
  { rpa: 1, nome: 'Centro' },
  { rpa: 2, nome: 'Norte' },
  { rpa: 3, nome: 'Noroeste' },
  { rpa: 4, nome: 'Oeste' },
  { rpa: 5, nome: 'Sudoeste' },
  { rpa: 6, nome: 'Sul' },
];

// Mesmas cores do dashboard Streamlit.
const COR_SITUACAO: Record<string, string> = {
  Atendida: '#13957f',
  Execucao: '#3b79ba',
  Cadastrada: '#93bfc7',
  Preparacao: '#e8ad55',
  Pendencia: '#c77a50',
  Fiscalizacao: '#777998',
  'Não informado': '#c0c7cb',
};

const numero = (n: number) => n.toLocaleString('pt-BR');
const percentual = (fracao: number) => `${(fracao * 100).toFixed(1).replace('.', ',')}%`;
/** "2026-01-30" ou ISO com hora → "30/01/2026" (sem passar por Date, que mudaria o dia pelo fuso). */
const dataBr = (iso: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

export function InsightsCidadeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rpa, setRpa] = useState<number | undefined>(undefined);
  const [dados, setDados] = useState<InsightsRecife | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (filtro: number | undefined) => {
    try {
      setDados(await obterInsightsRecife(filtro));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os insights.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    load(rpa);
  }, [load, rpa]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await load(rpa);
    setIsRefreshing(false);
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(routes.inicio));

  return (
    <GradientBackground variant="screen" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Insights da cidade" onBack={goBack} testID="insights-header" />

      {!dados && isLoading && (
        <View className="flex-1 items-center justify-center">
          <Loading color={palette.white} testID="insights-loading" />
        </View>
      )}

      {!dados && !isLoading && error && (
        <View className="flex-1 items-center justify-center gap-3 px-8" testID="insights-error">
          <Text className="text-center font-inter-semibold text-[15px] text-white">{error}</Text>
          <Button label="Tentar novamente" variant="surface" onPress={() => load(rpa)} testID="insights-retry" />
        </View>
      )}

      {dados && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={palette.white} />}
          testID="insights-scroll"
        >
          <View className="gap-4 px-4">
            <View>
              <Text className="font-inter-extrabold text-xl text-white">Recife em demandas</Text>
              <Text className="font-inter-medium text-[13px] text-white/80">
                Central 156 (EMLURB) · dados abertos tratados pela nossa pipeline
              </Text>
            </View>

            <RpaChips selecionada={rpa} onChange={setRpa} />
            {error && <Text className="text-center font-inter-semibold text-[13px] text-white">{error}</Text>}

            <View className="flex-row flex-wrap gap-3">
              <Kpi label="Solicitações" value={numero(dados.indicadores.total)} testID="insights-total" />
              <Kpi
                label="Atendidas"
                value={dados.indicadores.taxa_atendimento === null ? '—' : percentual(dados.indicadores.taxa_atendimento)}
                color={COR_SITUACAO.Atendida}
                testID="insights-taxa"
              />
              <Kpi
                label="Em andamento"
                value={numero(dados.indicadores.em_andamento)}
                color={COR_SITUACAO.Execucao}
                testID="insights-andamento"
              />
              <Kpi label="Bairros" value={numero(dados.indicadores.bairros)} testID="insights-bairros" />
            </View>

            {dados.indicadores.total === 0 ? (
              <View className="items-center rounded-card bg-white p-6 shadow-md" testID="insights-vazio">
                <Text className="text-center font-inter-semibold text-[15px] text-text">Nenhuma solicitação nesta RPA.</Text>
              </View>
            ) : (
              <>
                <Situacoes dados={dados} />
                <BarList
                  title="Serviços mais solicitados"
                  testID="insights-servicos"
                  formatValue={numero}
                  items={dados.top_servicos.map((item) => ({
                    key: item.grupo,
                    label: item.grupo,
                    value: item.total,
                    color: colors.primary,
                  }))}
                />
                <BarList
                  title="Demandas por RPA"
                  testID="insights-rpas"
                  formatValue={numero}
                  items={dados.por_rpa.map((item) => ({
                    key: String(item.rpa),
                    label: item.rpa === null ? item.nome : `${item.rpa} ${item.nome}`,
                    value: item.total,
                    // Com filtro, a RPA escolhida fica em destaque frente às demais.
                    color: rpa === undefined || item.rpa === rpa ? colors.navy : palette.textSubtle,
                  }))}
                />
                <BarList
                  title="Bairros com mais demandas"
                  testID="insights-top-bairros"
                  formatValue={numero}
                  items={dados.top_bairros.map((item) => ({
                    key: item.bairro,
                    label: item.bairro,
                    value: item.total,
                    color: colors.primary,
                  }))}
                />
              </>
            )}

            <Fonte fonte={dados.fonte} />
          </View>
        </ScrollView>
      )}
    </GradientBackground>
  );
}

function RpaChips({ selecionada, onChange }: { selecionada?: number; onChange: (rpa: number | undefined) => void }) {
  const opcoes = [{ key: 'todas', label: 'Todas', value: undefined }, ...RPAS.map((r) => ({ key: String(r.rpa), label: `${r.rpa} ${r.nome}`, value: r.rpa }))];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {opcoes.map((opcao) => {
        const ativa = opcao.value === selecionada;
        return (
          <Pressable
            key={opcao.key}
            testID={`insights-rpa-${opcao.key}`}
            onPress={() => onChange(opcao.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: ativa }}
            className={`rounded-full px-3.5 py-2 ${ativa ? 'bg-white' : 'bg-white/20'}`}
          >
            <Text className={`font-inter-bold text-[13px] ${ativa ? 'text-navy' : 'text-white'}`}>{opcao.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Kpi({ label, value, color = colors.navy, testID }: { label: string; value: string; color?: string; testID?: string }) {
  return (
    <View className="min-w-[45%] flex-1 rounded-2xl bg-white px-4 py-3.5 shadow-sm" testID={testID}>
      <Text className="font-inter-extrabold text-[26px]" style={{ color }}>
        {value}
      </Text>
      <Text className="font-inter-semibold text-[13px] text-textMuted">{label}</Text>
    </View>
  );
}

function Situacoes({ dados }: { dados: InsightsRecife }) {
  const total = dados.indicadores.total;
  const cor = (situacao: string) => COR_SITUACAO[situacao] ?? COR_SITUACAO.Fiscalizacao;
  return (
    <View className="gap-4 rounded-card bg-white p-5 shadow-md" testID="insights-situacao">
      <Text className="font-inter-bold text-xs uppercase text-primary">Distribuição por situação</Text>
      <View className="items-center">
        <DonutChart
          centerValue={numero(total)}
          centerLabel="solicitações"
          slices={dados.por_situacao.map((item) => ({ key: item.situacao, value: item.total, color: cor(item.situacao) }))}
        />
      </View>
      <View className="flex-row flex-wrap gap-y-2">
        {dados.por_situacao.map((item) => {
          const texto = `${numero(item.total)} (${percentual(item.total / total)})`;
          return (
            <View key={item.situacao} className="w-1/2 flex-row items-center gap-2 pr-2" accessible accessibilityLabel={`${item.situacao}: ${texto}`}>
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cor(item.situacao) }} />
              <View className="flex-1">
                <Text className="font-inter-semibold text-[13px] text-text">{item.situacao}</Text>
                <Text className="font-inter-medium text-xs text-textMuted">{texto}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Fonte({ fonte }: { fonte: InsightsRecife['fonte'] }) {
  return (
    <View className="gap-2 rounded-card bg-white/95 p-5 shadow-md" testID="insights-fonte">
      <Text className="font-inter-bold text-xs uppercase text-primary">De onde vêm esses dados</Text>
      <Text className="font-inter-semibold text-[13px] leading-[19px] text-text">
        API CKAN (Dados Abertos do Recife) → MongoDB Atlas (bronze) → transformação → Neon (prata) → ResolveAí
      </Text>
      <Text className="font-inter-medium text-[13px] leading-[18px] text-textMuted">
        {`Situações de ${dataBr(fonte.periodo_inicio)} a ${dataBr(fonte.periodo_fim)} · carga de ${dataBr(fonte.data_extracao)} via ${fonte.origem_extracao ?? '—'}`}
      </Text>
      {fonte.total_bronze !== null && fonte.total_final !== null && (
        <Text className="font-inter-medium text-[13px] leading-[18px] text-textMuted">
          {`Reconciliação: ${numero(fonte.total_bronze)} no bronze = ${numero(fonte.total_final)} no Neon`}
        </Text>
      )}
      <Text className="font-inter text-xs leading-[17px] text-textMuted">
        Retrato histórico de registros administrativos; não representa todas as necessidades da população.
      </Text>
    </View>
  );
}

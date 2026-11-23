import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listarDemandas } from '../../api/demandas';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { GradientBackground } from '../../components/GradientBackground';
import { Icon, type IconName } from '../../components/Icon';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';
import { useTabBarInset } from '../../components/TabBar';
import { STATUS_META, STATUS_ORDEM, formatarData, perfilLabel } from '../../domain/demanda';
import { routes } from '../../navigation/routes';
import { colors, palette } from '../../theme';
import type { Demanda, DemandaStatus } from '../../types';

type Resumo = { total: number; porStatus: Record<DemandaStatus, number>; recentes: Demanda[] };

const PASSOS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'camera', title: 'Registre', text: 'Fotografe o problema; o GPS preenche o endereço.' },
  { icon: 'demands', title: 'Acompanhe', text: 'Veja o status da sua demanda a qualquer momento.' },
  { icon: 'bell', title: 'Seja avisado', text: 'Notificamos você quando o gestor atualizar o status.' },
];

/** Total por status vem do `paginacao.total` (uma página de 1 item por status). */
async function carregarResumo(): Promise<Resumo> {
  const [recentes, ...porStatus] = await Promise.all([
    listarDemandas({ page: 1, per_page: 3 }),
    ...STATUS_ORDEM.map((status) => listarDemandas({ status, page: 1, per_page: 1 })),
  ]);
  return {
    total: recentes.paginacao.total,
    recentes: recentes.demandas,
    porStatus: Object.fromEntries(STATUS_ORDEM.map((status, i) => [status, porStatus[i].paginacao.total])) as Record<
      DemandaStatus,
      number
    >,
  };
}

// Início do cidadão: atalho para registrar, resumo das próprias demandas e o fluxo do app.
export function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const inicial = (user?.name ?? '?').trim().charAt(0).toUpperCase();

  const load = useCallback(async () => {
    try {
      setResumo(await carregarResumo());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar suas demandas.');
    }
  }, []);

  // Volta ao foco depois de registrar/editar: os números se atualizam.
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
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarInset + 24 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={palette.white} />}
        testID="home-scroll"
      >
        <View className="gap-5 px-4 pt-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Text className="font-inter-extrabold text-xl text-white">{inicial}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-inter-extrabold text-xl text-white" numberOfLines={1}>
              Olá, {user?.name ?? 'visitante'}!
            </Text>
            <Text className="font-inter-medium text-[13px] text-white/80" testID="home-perfil">
              Perfil: {perfilLabel(user?.role)}
            </Text>
          </View>
          <Pressable
            onPress={() => logout()}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            hitSlop={8}
            className="rounded-full bg-white/20 px-3 py-2 active:opacity-70"
            testID="home-logout"
          >
            <Text className="font-inter-bold text-xs text-white">Sair</Text>
          </Pressable>
        </View>

        <View className="gap-3 rounded-card bg-white p-5 shadow-md">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-infoSoft">
              <Icon name="alert" size={22} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-inter-extrabold text-lg text-navy">Viu um problema na cidade?</Text>
              <Text className="font-inter-medium text-[13px] text-textMuted">
                Buraco, iluminação, lixo... Registre em menos de um minuto.
              </Text>
            </View>
          </View>
          <Button
            label="Registrar nova demanda"
            icon="plus"
            onPress={() => router.push(routes.novaDemanda)}
            testID="home-nova-demanda"
          />
        </View>

        <View className="gap-3 rounded-card bg-white p-5 shadow-md" testID="home-resumo">
          <View className="flex-row items-center justify-between">
            <Text className="font-inter-bold text-xs uppercase text-primary">Minhas demandas</Text>
            <Pressable onPress={() => router.push(routes.demandas)} hitSlop={8} testID="home-ver-todas">
              <Text className="font-inter-semibold text-xs text-primary">Ver todas</Text>
            </Pressable>
          </View>

          {!resumo && !error && <Loading color={colors.primary} size="small" testID="home-loading" />}

          {!resumo && error && (
            <View className="items-center gap-2" testID="home-error">
              <Text className="text-center font-inter-medium text-[13px] text-textMuted">{error}</Text>
              <Pressable onPress={load} hitSlop={8} testID="home-retry">
                <Text className="font-inter-bold text-[13px] text-primary">Tentar novamente</Text>
              </Pressable>
            </View>
          )}

          {resumo && (
            <>
              <View className="flex-row flex-wrap gap-2">
                {STATUS_ORDEM.map((status) => (
                  <View
                    key={status}
                    className="min-w-[45%] flex-1 rounded-2xl px-3 py-2.5"
                    style={{ backgroundColor: STATUS_META[status].background }}
                    testID={`home-status-${status}`}
                  >
                    <Text className="font-inter-extrabold text-2xl" style={{ color: STATUS_META[status].color }}>
                      {resumo.porStatus[status]}
                    </Text>
                    <Text className="font-inter-semibold text-xs text-textMuted">{STATUS_META[status].label}</Text>
                  </View>
                ))}
              </View>

              {resumo.recentes.length === 0 ? (
                <Text className="font-inter-medium text-[13px] text-textMuted" testID="home-vazio">
                  Você ainda não registrou nenhuma demanda.
                </Text>
              ) : (
                <View className="gap-1">
                  <Text className="font-inter-semibold text-xs text-textSubtle">Mais recentes</Text>
                  {resumo.recentes.map((demanda) => (
                    <Pressable
                      key={demanda.id}
                      onPress={() => router.push(routes.demanda(demanda.id))}
                      className="flex-row items-center gap-3 border-b border-border py-2.5 active:opacity-70"
                      testID={`home-recente-${demanda.id}`}
                    >
                      <View className="flex-1">
                        <Text className="font-inter-bold text-sm text-text" numberOfLines={1}>
                          {demanda.title}
                        </Text>
                        <Text className="font-inter-medium text-[11px] text-textSubtle">
                          {formatarData(demanda.createdAt)}
                        </Text>
                      </View>
                      <StatusBadge status={demanda.status} />
                      <Icon name="chevronRight" size={16} color={palette.textSubtle} />
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        <View className="gap-3">
          <Text className="font-inter-bold text-xs uppercase text-white/90">Como funciona</Text>
          {PASSOS.map((passo, index) => (
            <View key={passo.title} className="flex-row items-center gap-3 rounded-2xl bg-white/15 p-3.5">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
                <Icon name={passo.icon} size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-inter-bold text-sm text-white">
                  {index + 1}. {passo.title}
                </Text>
                <Text className="font-inter-medium text-xs text-white/85">{passo.text}</Text>
              </View>
            </View>
          ))}
        </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

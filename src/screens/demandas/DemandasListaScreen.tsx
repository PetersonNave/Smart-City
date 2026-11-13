import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  type Demanda,
  type DemandaCategoria,
  type DemandaRegiao,
  type DemandaStatus,
} from '../../api/demandas';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { ConfirmModal } from '../../components/ConfirmModal';
import { DemandCard } from '../../components/DemandCard';
import { Fab } from '../../components/Fab';
import { GradientBackground } from '../../components/GradientBackground';
import { Loading } from '../../components/Loading';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { SegmentedControl, type SegmentOption } from '../../components/SegmentedControl';
import { SelectField, type SelectOption } from '../../components/SelectField';
import { useTabBarInset } from '../../components/TabBar';
import { Toast } from '../../components/Toast';
import {
  CATEGORIA_LABELS,
  CATEGORIA_OPTIONS,
  REGIAO_LABELS,
  REGIAO_OPTIONS,
  STATUS_META,
  podeExcluir,
} from '../../domain/demanda';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { routes } from '../../navigation/routes';
import { useDemandStore } from '../../stores/demandStore';
import { fonts, palette } from '../../theme';

type StatusFiltro = 'TODAS' | DemandaStatus;

const STATUS_OPTIONS: SegmentOption<StatusFiltro>[] = [
  { value: 'TODAS', label: 'Todas' },
  ...(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const).map((value) => ({
    value,
    label: STATUS_META[value].label,
  })),
];

const TODAS = 'TODAS' as const;

const CATEGORIA_FILTRO_OPTIONS: SelectOption<typeof TODAS | DemandaCategoria>[] = [
  { value: TODAS, label: 'Todas as categorias' },
  ...CATEGORIA_OPTIONS,
];

const REGIAO_FILTRO_OPTIONS: SelectOption<typeof TODAS | DemandaRegiao>[] = [
  { value: TODAS, label: 'Todas as regiões' },
  ...REGIAO_OPTIONS,
];

export function DemandasListaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();

  // Lista, filtros e paginação ficam no store global: sobrevivem à troca de abas e são
  // atualizados pelo detalhe/edição (ex.: o gestor muda o status e a lista já reflete).
  const demandas = useDemandStore((state) => state.items);
  const status = useDemandStore((state) => state.listStatus);
  const loadError = useDemandStore((state) => state.listError);
  const isLoadingMore = useDemandStore((state) => state.isLoadingMore);
  const isFiltering = useDemandStore((state) => state.isFiltering);
  const filtros = useDemandStore((state) => state.filters);
  const { loadFirstPage, retryFirstLoad, loadMore, setFilters, clearFilters, remove, setListError } =
    useDemandStore.getState();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Demanda | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Busca com debounce, para não chamar a API a cada tecla.
  const [busca, setBusca] = useState(filtros.q ?? '');
  const q = useDebouncedValue(busca.trim(), 400);
  useEffect(() => {
    if ((q || undefined) !== useDemandStore.getState().filters.q) setFilters({ q: q || undefined });
  }, [q, setFilters]);
  const statusFiltro: StatusFiltro = filtros.status ?? 'TODAS';
  const hasFilters = Boolean(filtros.q || filtros.status || filtros.categoria || filtros.regiao);

  // Recarrega quando a aba volta ao foco (ex.: depois de registrar uma demanda) e quando os filtros mudam.
  useFocusEffect(
    useCallback(() => {
      loadFirstPage();
    }, [filtros, loadFirstPage])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadFirstPage();
    setIsRefreshing(false);
  }

  async function handleConfirmDelete() {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await remove(toDelete.id);
      setToast('Demanda excluída com sucesso!');
      setListError(null);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Não foi possível excluir a demanda.');
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  }

  const hideToast = useCallback(() => setToast(null), []);
  const isGestor = user?.role === 'gestor';

  return (
    <GradientBackground variant="screen" style={{ paddingTop: insets.top }}>
      <ScreenHeader title={isGestor ? 'Analisar Demandas' : 'Minhas Demandas'} testID="demandas-header" />

      {status !== 'error' && (
        <View style={styles.filters}>
          <SearchBar
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por título, descrição ou endereço"
            testID="demandas-busca"
          />
          <SegmentedControl
            options={STATUS_OPTIONS}
            value={statusFiltro}
            onChange={(value) => setFilters({ status: value === 'TODAS' ? undefined : value })}
            accessibilityLabel="Filtrar por status"
            testID="demandas-status"
          />
          <View style={styles.selectRow}>
            <SelectField
              variant="chip"
              label="Filtrar por categoria"
              placeholder="Todas as categorias"
              value={filtros.categoria ?? TODAS}
              options={CATEGORIA_FILTRO_OPTIONS}
              onChange={(value) => setFilters({ categoria: value === TODAS ? undefined : value })}
              testID="demandas-categoria"
            />
            <SelectField
              variant="chip"
              label="Filtrar por região"
              placeholder="Todas as regiões"
              value={filtros.regiao ?? TODAS}
              options={REGIAO_FILTRO_OPTIONS}
              onChange={(value) => setFilters({ regiao: value === TODAS ? undefined : value })}
              testID="demandas-regiao"
            />
          </View>
        </View>
      )}

      <View style={styles.feedback}>
        {isFiltering && <Loading color={palette.white} size="small" testID="demandas-filtrando" />}
        <Toast message={toast} onHide={hideToast} testID="demandas-toast" />
        {status === 'ready' && loadError && (
          <Text style={styles.inlineError} testID="demandas-inline-error">
            {loadError}
          </Text>
        )}
      </View>

      {status === 'loading' && (
        <View style={styles.centered}>
          <Loading color={palette.white} testID="demandas-loading" />
        </View>
      )}

      {status === 'error' && (
        <View style={[styles.centered, styles.padded]} testID="demandas-error">
          <Text style={styles.emptyTitle}>Não foi possível carregar</Text>
          <Text style={styles.emptyText}>{loadError}</Text>
          <Button
            label="Tentar novamente"
            variant="surface"
            onPress={retryFirstLoad}
            testID="demandas-retry"
          />
        </View>
      )}

      {status === 'ready' && (
        <FlatList
          data={demandas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarInset + 96 }]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={palette.white} />
          }
          onEndReachedThreshold={0.3}
          onEndReached={loadMore}
          ListFooterComponent={isLoadingMore ? <Loading color={palette.white} size="small" /> : null}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            hasFilters ? (
              <View style={styles.empty} testID="demandas-sem-resultado">
                <Text style={styles.emptyTitle}>Nenhuma demanda encontrada</Text>
                <Text style={styles.emptyText}>
                  {filtros.q ? `Nada corresponde a "${filtros.q}"` : 'Nenhuma demanda'}
                  {filtros.status ? ` com status ${STATUS_META[filtros.status].label.toLowerCase()}` : ''}
                  {filtros.categoria ? ` em ${CATEGORIA_LABELS[filtros.categoria].toLowerCase()}` : ''}
                  {filtros.regiao ? ` na região ${REGIAO_LABELS[filtros.regiao]}` : ''}.
                </Text>
                <Button
                  label="Limpar filtros"
                  variant="surface"
                  onPress={() => {
                    setBusca('');
                    clearFilters();
                  }}
                  testID="demandas-limpar-filtros"
                />
              </View>
            ) : (
              <View style={styles.empty} testID="demandas-empty">
                <Text style={styles.emptyTitle}>Nenhuma demanda por aqui</Text>
                <Text style={styles.emptyText}>
                  Viu algum problema na cidade? Toque no botão + para registrar sua primeira demanda.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <DemandCard
              demanda={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId((current) => (current === item.id ? null : item.id))}
              onOpenDetails={() => router.push(routes.demanda(item.id))}
              onDelete={podeExcluir(item, user) ? () => setToDelete(item) : undefined}
              testID={`demand-card-${item.id}`}
            />
          )}
        />
      )}

      <Fab
        onPress={() => router.push(routes.novaDemanda)}
        accessibilityLabel="Registrar nova demanda"
        style={[styles.fab, { bottom: tabBarInset + 16 }]}
        testID="demandas-fab"
      />

      <ConfirmModal
        visible={toDelete !== null}
        title="Excluir Demanda?"
        message={
          <>
            Tem certeza que deseja excluir a demanda{' '}
            <Text style={styles.modalStrong}>"{toDelete?.title}"</Text>? Esta ação não poderá ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setToDelete(null)}
        testID="delete-modal"
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  filters: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  selectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  feedback: {
    paddingHorizontal: 16,
    gap: 8,
  },
  inlineError: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: palette.white,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  padded: {
    paddingHorizontal: 32,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 18,
    color: palette.white,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    lineHeight: 20,
    color: palette.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
  },
  modalStrong: {
    fontFamily: fonts.inter.bold,
    color: palette.text,
  },
});

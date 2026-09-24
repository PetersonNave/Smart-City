import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { excluirDemanda, listarDemandas, type Demanda } from '../../api/demandas';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { ConfirmModal } from '../../components/ConfirmModal';
import { DemandCard } from '../../components/DemandCard';
import { Fab } from '../../components/Fab';
import { GradientBackground } from '../../components/GradientBackground';
import { Loading } from '../../components/Loading';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTabBarInset } from '../../components/TabBar';
import { Toast } from '../../components/Toast';
import { podeExcluir } from '../../domain/demanda';
import type { DemandasStackScreenProps } from '../../navigation/types';
import { fonts, palette } from '../../theme';

const PER_PAGE = 10;

type Props = DemandasStackScreenProps<'DemandasLista'>;

export function DemandasListaScreen({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();

  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Demanda | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const loadFirstPage = useCallback(async () => {
    try {
      const result = await listarDemandas({ page: 1, per_page: PER_PAGE });
      setDemandas(result.demandas);
      setPage(1);
      setHasNextPage(result.paginacao.tem_proxima);
      setLoadError(null);
      setStatus('ready');
      hasLoadedOnce.current = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar as demandas.';
      setLoadError(message);
      // Numa atualização em segundo plano, mantém a lista antiga visível (erro vira aviso em linha).
      if (!hasLoadedOnce.current) {
        setStatus('error');
      }
    }
  }, []);

  // Recarrega sempre que a aba volta ao foco (ex.: depois de registrar uma nova demanda).
  useFocusEffect(
    useCallback(() => {
      loadFirstPage();
    }, [loadFirstPage])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadFirstPage();
    setIsRefreshing(false);
  }

  async function handleLoadMore() {
    if (!hasNextPage || isLoadingMore || status !== 'ready') return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await listarDemandas({ page: nextPage, per_page: PER_PAGE });
      setDemandas((current) => {
        const known = new Set(current.map((item) => item.id));
        return [...current, ...result.demandas.filter((item) => !known.has(item.id))];
      });
      setPage(nextPage);
      setHasNextPage(result.paginacao.tem_proxima);
    } catch {
      // Falha ao paginar não derruba a lista; o usuário pode rolar de novo para tentar.
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleConfirmDelete() {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await excluirDemanda(toDelete.id);
      setDemandas((current) => current.filter((item) => item.id !== toDelete.id));
      setToast('Demanda excluída com sucesso!');
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível excluir a demanda.');
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

      <View style={styles.feedback}>
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
            onPress={() => {
              setStatus('loading');
              loadFirstPage();
            }}
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
          onEndReached={handleLoadMore}
          ListFooterComponent={isLoadingMore ? <Loading color={palette.white} size="small" /> : null}
          ListEmptyComponent={
            <View style={styles.empty} testID="demandas-empty">
              <Text style={styles.emptyTitle}>Nenhuma demanda por aqui</Text>
              <Text style={styles.emptyText}>
                Viu algum problema na cidade? Toque no botão + para registrar sua primeira demanda.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <DemandCard
              demanda={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId((current) => (current === item.id ? null : item.id))}
              onOpenDetails={() => navigation.navigate('DemandaDetalhe', { id: item.id })}
              onDelete={podeExcluir(item, user) ? () => setToDelete(item) : undefined}
              testID={`demand-card-${item.id}`}
            />
          )}
        />
      )}

      <Fab
        onPress={() => navigation.navigate('NovaDemanda')}
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

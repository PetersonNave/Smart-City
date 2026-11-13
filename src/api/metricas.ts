import { apiClient } from './client';
import { unwrap, type ApiEnvelope } from './envelope';
import type { DemandaCategoria, DemandaRegiao, DemandaStatus } from './demandas';

/** `GET /api/demandas/metricas` (somente gestor; cidadão recebe 403). */
export type MetricasPainel = {
  total: number;
  por_status: Record<DemandaStatus, number>;
  por_categoria: Record<DemandaCategoria, number>;
  por_regiao: Record<DemandaRegiao | 'NAO_INFORMADA', number>;
  /** Demandas concluídas/recusadas que entram no tempo médio. */
  atendidas: number;
  /** Registro → conclusão/recusa, em horas; null sem nenhuma demanda atendida. */
  tempo_medio_atendimento_horas: number | null;
  /** Concluídas / total (0 a 1). */
  taxa_resolucao: number;
};

export function obterMetricas(): Promise<MetricasPainel> {
  return unwrap(apiClient.get<ApiEnvelope<MetricasPainel>>('/api/demandas/metricas'));
}

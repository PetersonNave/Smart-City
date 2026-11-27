import { apiClient } from './client';
import { unwrap, type ApiEnvelope } from './envelope';

/**
 * `GET /api/insights/recife` (somente gestor): dados abertos da Central 156 (EMLURB) tratados pela
 * pipeline de dados do grupo (etl-smart-city) e lidos pelo backend no Neon, a camada prata.
 */
export type InsightsRecife = {
  filtro: { rpa: number | null; rpa_nome: string | null };
  indicadores: {
    total: number;
    atendidas: number;
    /** Atendidas / total (0 a 1); null quando o recorte não tem demandas. */
    taxa_atendimento: number | null;
    em_andamento: number;
    bairros: number;
  };
  por_situacao: { situacao: string; total: number }[];
  top_servicos: { grupo: string; total: number }[];
  /** Sempre as seis RPAs, mesmo com filtro. */
  por_rpa: { rpa: number | null; nome: string; total: number }[];
  top_bairros: { bairro: string; total: number }[];
  fonte: {
    nome: string;
    periodo_inicio: string | null;
    periodo_fim: string | null;
    origem_extracao: string | null;
    carga_id: string | null;
    data_extracao: string | null;
    total_bronze: number | null;
    total_final: number | null;
    sem_coordenadas: number | null;
  };
};

export function obterInsightsRecife(rpa?: number): Promise<InsightsRecife> {
  return unwrap(
    apiClient.get<ApiEnvelope<InsightsRecife>>('/api/insights/recife', { params: rpa ? { rpa } : undefined })
  );
}

import { apiClient } from './client';
import { unwrap, type ApiEnvelope } from './envelope';

// Valores aceitos pelo backend (schemas/demandas_schema.py).
export const DEMANDA_CATEGORIAS = [
  'ROAD_MAINTENANCE',
  'PUBLIC_LIGHTING',
  'GARBAGE_COLLECTION',
  'SANITATION',
  'INSPECTION',
  'OTHER',
] as const;
export type DemandaCategoria = (typeof DEMANDA_CATEGORIAS)[number];

export type DemandaStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
export type DemandaPrioridade = 'baixa' | 'media' | 'alta' | 'urgente';

/** Formato de resposta (`DemandaResponseSchema`): chaves em inglês, datas ISO sem fuso (UTC). */
export type Demanda = {
  id: number;
  title: string;
  description: string;
  category: DemandaCategoria;
  location: string;
  status: DemandaStatus;
  priority: DemandaPrioridade;
  createdAt: string;
  updatedAt: string | null;
};

export type Paginacao = {
  total: number;
  paginas: number;
  pagina_atual: number;
  por_pagina: number;
  tem_proxima: boolean;
  tem_anterior: boolean;
};

export type ListarDemandasParams = {
  page?: number;
  per_page?: number;
  status?: DemandaStatus;
  categoria?: DemandaCategoria;
  prioridade?: DemandaPrioridade;
};

/** Corpo de `POST /api/demandas` (`DemandaCreateSchema`): chaves em português. */
export type NovaDemandaInput = {
  titulo: string;
  descricao: string;
  categoria: DemandaCategoria;
  localizacao: string;
  prioridade: DemandaPrioridade;
};

export async function listarDemandas(
  params: ListarDemandasParams = {}
): Promise<{ demandas: Demanda[]; paginacao: Paginacao }> {
  return unwrap(
    apiClient.get<ApiEnvelope<{ demandas: Demanda[]; paginacao: Paginacao }>>('/api/demandas', { params })
  );
}

export async function obterDemanda(id: number): Promise<Demanda> {
  const data = await unwrap(apiClient.get<ApiEnvelope<{ demanda: Demanda }>>(`/api/demandas/${id}`));
  return data.demanda;
}

export async function criarDemanda(input: NovaDemandaInput): Promise<Demanda> {
  const data = await unwrap(apiClient.post<ApiEnvelope<{ demanda: Demanda }>>('/api/demandas', input));
  return data.demanda;
}

export async function excluirDemanda(id: number): Promise<void> {
  await unwrap(apiClient.delete<ApiEnvelope<null>>(`/api/demandas/${id}`));
}

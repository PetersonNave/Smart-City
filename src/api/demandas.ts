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
  /** URL absoluta da foto (`GET /api/demandas/fotos/<arquivo>`), ou null sem foto. */
  photoUrl: string | null;
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
  /** Busca em título, descrição e localização (o backend ignora maiúsculas e acentos). */
  q?: string;
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

/** Campos editáveis pelo cidadão (`PATCH` envia só o que mudou; status é exclusivo do gestor). */
export type EditarDemandaInput = Partial<Pick<NovaDemandaInput, 'titulo' | 'descricao' | 'categoria' | 'localizacao'>>;

export async function atualizarDemanda(id: number, input: EditarDemandaInput): Promise<Demanda> {
  const data = await unwrap(apiClient.patch<ApiEnvelope<{ demanda: Demanda }>>(`/api/demandas/${id}`, input));
  return data.demanda;
}

// Upload pode levar mais que o timeout padrão em rede móvel lenta.
const PHOTO_UPLOAD_TIMEOUT_MS = 60000;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

export type FotoLocal = {
  uri: string;
  /** Vem do ImagePicker; se ausente, é deduzido da extensão do arquivo. */
  mimeType?: string | null;
};

function describeFile(foto: FotoLocal) {
  const path = foto.uri.split('?')[0];
  const extension = path.split('.').pop()?.toLowerCase() ?? 'jpg';
  const type = foto.mimeType ?? MIME_BY_EXTENSION[extension] ?? 'image/jpeg';
  const name = path.split('/').pop() || `foto.${extension}`;
  return { uri: foto.uri, name, type };
}

/** `PUT /api/demandas/:id/foto` (multipart, campo "foto"). Substitui a foto anterior, se houver. */
export async function enviarFotoDemanda(id: number, foto: FotoLocal): Promise<Demanda> {
  const form = new FormData();
  // No React Native, o arquivo é descrito por { uri, name, type } e lido pelo próprio runtime.
  form.append('foto', describeFile(foto) as unknown as Blob);

  const data = await unwrap(
    apiClient.put<ApiEnvelope<{ demanda: Demanda }>>(`/api/demandas/${id}/foto`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Impede o axios de tentar serializar o FormData (quebra o upload no RN).
      transformRequest: (body) => body,
      timeout: PHOTO_UPLOAD_TIMEOUT_MS,
    })
  );
  return data.demanda;
}

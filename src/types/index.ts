// Ponto único de importação dos tipos de domínio. Os tipos são definidos uma vez, junto do
// contrato da API que os descreve (src/api/*), e reexportados aqui para telas e stores.
export type { AuthUser } from '../api/auth';
export type {
  Demanda,
  DemandaCategoria,
  DemandaPrioridade,
  DemandaRegiao,
  DemandaStatus,
  EditarDemandaInput,
  FotoLocal,
  ListarDemandasParams,
  NovaDemandaInput,
  Paginacao,
} from '../api/demandas';
export type { ApiEnvelope, ApiFieldErrors } from '../api/envelope';
export type { AuthTokens } from '../auth/storage';
export type { CacheEntry, CacheKey } from '../storage/cache';
export type { DemandaFiltros, DemandListStatus } from '../stores/demandStore';

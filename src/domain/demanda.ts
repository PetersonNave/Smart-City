import type { AuthUser } from '../api/auth';
import type { Demanda, DemandaCategoria, DemandaStatus } from '../api/demandas';
import type { IconName } from '../components/Icon';
import { palette } from '../theme';

export const CATEGORIA_LABELS: Record<DemandaCategoria, string> = {
  ROAD_MAINTENANCE: 'Manutenção de vias',
  PUBLIC_LIGHTING: 'Iluminação pública',
  GARBAGE_COLLECTION: 'Coleta de lixo',
  SANITATION: 'Saneamento',
  INSPECTION: 'Fiscalização',
  OTHER: 'Outros',
};

export const CATEGORIA_ICONS: Record<DemandaCategoria, IconName> = {
  ROAD_MAINTENANCE: 'construction',
  PUBLIC_LIGHTING: 'lightbulb',
  GARBAGE_COLLECTION: 'trash',
  SANITATION: 'droplets',
  INSPECTION: 'search',
  OTHER: 'help',
};

// Cores dos badges de status do Figma (frame "Analisar Demandas").
export const STATUS_META: Record<DemandaStatus, { label: string; color: string; background: string }> = {
  PENDING: { label: 'Pendente', color: palette.warning, background: palette.warningSoft },
  IN_PROGRESS: { label: 'Em análise', color: palette.info, background: palette.infoSoft },
  RESOLVED: { label: 'Concluída', color: palette.success, background: palette.successSoft },
  REJECTED: { label: 'Recusada', color: palette.danger, background: palette.dangerSoft },
};

/** O backend devolve datas UTC sem sufixo de fuso ("2026-10-15T13:20:00"). */
function parseApiDate(value: string): Date {
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

/** "2026-10-15T13:20:00" → "15/10/2026" (no fuso local do aparelho). */
export function formatarData(value: string): string {
  const date = parseApiDate(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/** Número de protocolo exibido ao cidadão: ano de registro + id com 5 dígitos ("#2026-00187"). */
export function formatarProtocolo(demanda: Pick<Demanda, 'id' | 'createdAt'>): string {
  const date = parseApiDate(demanda.createdAt);
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `#${year}-${String(demanda.id).padStart(5, '0')}`;
}

/**
 * Regra do backend (DemandaService.deletar_demanda): gestor exclui qualquer demanda;
 * cidadão só exclui as próprias enquanto estão pendentes.
 */
export function podeExcluir(demanda: Pick<Demanda, 'status'>, user: Pick<AuthUser, 'role'> | null): boolean {
  if (user?.role === 'gestor') return true;
  return demanda.status === 'PENDING';
}

import type { AuthUser } from '../api/auth';
import type { Demanda, DemandaCategoria, DemandaRegiao, DemandaStatus } from '../api/demandas';
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

export const STATUS_ORDEM: DemandaStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export const STATUS_OPTIONS = STATUS_ORDEM.map((value) => ({ value, label: STATUS_META[value].label }));

export const REGIAO_LABELS: Record<DemandaRegiao, string> = {
  CENTRO: 'Centro',
  NORTE: 'Zona Norte',
  SUL: 'Zona Sul',
  LESTE: 'Zona Leste',
  OESTE: 'Zona Oeste',
};

// Derivadas dos rótulos (e não das listas da API) para seguirem a mesma ordem em toda a UI.
export const REGIAO_OPTIONS = (Object.keys(REGIAO_LABELS) as DemandaRegiao[]).map((value) => ({
  value,
  label: REGIAO_LABELS[value],
}));

export const CATEGORIA_OPTIONS = (Object.keys(CATEGORIA_LABELS) as DemandaCategoria[]).map((value) => ({
  value,
  label: CATEGORIA_LABELS[value],
}));

/** "36.5" horas → "1 dia e 12 h"; abaixo de 1 h, em minutos. */
export function formatarDuracaoHoras(horas: number | null | undefined): string {
  if (horas === null || horas === undefined || Number.isNaN(horas)) return '—';
  if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`;
  if (horas < 24) return `${Math.round(horas)} h`;
  const dias = Math.floor(horas / 24);
  const resto = Math.round(horas - dias * 24);
  const diasTexto = dias === 1 ? '1 dia' : `${dias} dias`;
  return resto ? `${diasTexto} e ${resto} h` : diasTexto;
}

/** Perfis de acesso devolvidos pela API (`role`). */
export const PERFIL_LABELS: Record<string, string> = {
  cidadao: 'Cidadão',
  gestor: 'Gestor Público',
};

export function perfilLabel(role: string | undefined | null): string {
  return (role && PERFIL_LABELS[role]) || 'Cidadão';
}

export function isGestor(user: Pick<AuthUser, 'role'> | null | undefined): boolean {
  return user?.role === 'gestor';
}

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
  if (isGestor(user)) return true;
  return demanda.status === 'PENDING';
}

/**
 * Regra do backend (DemandaService._garantir_pode_editar), vale para dados e foto:
 * gestor edita qualquer demanda; cidadão só as próprias enquanto estão pendentes.
 * (A lista/detalhe do cidadão já só traz as próprias demandas.)
 */
export function podeEditar(demanda: Pick<Demanda, 'status'>, user: Pick<AuthUser, 'role'> | null): boolean {
  return podeExcluir(demanda, user);
}

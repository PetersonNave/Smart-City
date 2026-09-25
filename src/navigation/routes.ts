// Rotas do Expo Router (arquivos em /app). Centralizadas aqui para as telas não montarem
// caminhos à mão.
//
// app/
//  ├─ _layout.tsx              raiz: fontes, providers e proteção por sessão (Stack.Protected)
//  ├─ (auth)/                  só para visitantes
//  │   ├─ login.tsx            /login
//  │   └─ cadastro.tsx         /cadastro
//  └─ (app)/                   só para usuários logados
//      ├─ (tabs)/              abas com a TabBar do Figma
//      │   ├─ index.tsx        /            (Início)
//      │   ├─ mapa.tsx         /mapa
//      │   ├─ demandas/        /demandas, /demandas/:id, /demandas/:id/editar
//      │   └─ perfil.tsx       /perfil
//      ├─ nova-demanda.tsx     /nova-demanda    (sem tab bar, como no Figma)
//      └─ demanda-enviada.tsx  /demanda-enviada?id=
//
// Parâmetros de URL são sempre strings: telas recebem ids e buscam os dados na API.

export const routes = {
  login: '/login',
  cadastro: '/cadastro',
  inicio: '/',
  demandas: '/demandas',
  novaDemanda: '/nova-demanda',
  demanda: (id: number) => ({ pathname: '/demandas/[id]', params: { id: String(id) } }) as const,
  editarDemanda: (id: number) => ({ pathname: '/demandas/[id]/editar', params: { id: String(id) } }) as const,
  demandaEnviada: (id: number, fotoPendente: boolean) =>
    ({
      pathname: '/demanda-enviada',
      params: fotoPendente ? { id: String(id), fotoPendente: '1' } : { id: String(id) },
    }) as const,
};

/** Resultado da edição, levado ao detalhe pela URL (`atualizada` muda a cada edição e força o recarregamento). */
export type DemandaEditFeedback = {
  at: number;
  localizacaoAtualizada: boolean;
  fotoFalhou: boolean;
};

export function demandaAtualizadaRoute(id: number, feedback: DemandaEditFeedback) {
  return {
    pathname: '/demandas/[id]',
    params: {
      id: String(id),
      atualizada: String(feedback.at),
      localizacaoAtualizada: feedback.localizacaoAtualizada ? '1' : '0',
      fotoFalhou: feedback.fotoFalhou ? '1' : '0',
    },
  } as const;
}

type Param = string | string[] | undefined;

/** Primeiro valor de um parâmetro de URL (parâmetros repetidos chegam como array). */
export function paramValue(value: Param): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Id numérico positivo vindo da URL, ou null se inválido (ex.: /demandas/abc). */
export function parseIdParam(value: Param): number | null {
  const raw = paramValue(value);
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 ? id : null;
}

/** Lê o feedback de edição dos parâmetros do detalhe (ausente se a tela não veio da edição). */
export function parseEditFeedback(params: Record<string, Param>): DemandaEditFeedback | undefined {
  const at = Number(paramValue(params.atualizada));
  if (!at) return undefined;
  return {
    at,
    localizacaoAtualizada: paramValue(params.localizacaoAtualizada) === '1',
    fotoFalhou: paramValue(params.fotoFalhou) === '1',
  };
}

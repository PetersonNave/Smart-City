import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Demanda } from '../api/demandas';

// Área logada:
// AppStack (sem tab bar nas telas de fluxo)
//  ├─ Tabs ─┬─ Inicio
//  │        ├─ Mapa
//  │        ├─ Demandas (stack) ─┬─ DemandasLista
//  │        │                    └─ DemandaDetalhe
//  │        └─ Perfil
//  ├─ NovaDemanda
//  └─ DemandaEnviada

export type DemandasStackParamList = {
  DemandasLista: undefined;
  DemandaDetalhe: { id: number };
};

export type AppTabsParamList = {
  Inicio: undefined;
  Mapa: undefined;
  Demandas: NavigatorScreenParams<DemandasStackParamList> | undefined;
  Perfil: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabsParamList> | undefined;
  NovaDemanda: undefined;
  /** fotoPendente: a demanda foi criada mas o upload da foto falhou. */
  DemandaEnviada: { demanda: Demanda; fotoPendente?: boolean };
};

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<AppStackParamList, T>;

export type DemandasStackScreenProps<T extends keyof DemandasStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<DemandasStackParamList, T>,
  CompositeScreenProps<BottomTabScreenProps<AppTabsParamList, 'Demandas'>, AppStackScreenProps<'Tabs'>>
>;

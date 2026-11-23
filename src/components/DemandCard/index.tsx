import { Pressable, Text, View } from 'react-native';
import type { Demanda } from '../../types';
import { CATEGORIA_LABELS, REGIAO_LABELS, formatarData } from '../../domain/demanda';
import { colors, palette } from '../../theme';
import { DemandThumb } from '../DemandThumb';
import { Icon } from '../Icon';
import { StatusBadge } from '../StatusBadge';

export type DemandCardProps = {
  demanda: Demanda;
  expanded?: boolean;
  /** Toque no card: alterna a área expandida (categoria + descrição). */
  onToggle?: () => void;
  onOpenDetails?: () => void;
  /** Quando ausente, o botão de lixeira não aparece (ex.: demanda já em análise). */
  onDelete?: () => void;
  testID?: string;
};

// Figma "demand-card" (frame "Analisar Demandas"), refinado com NativeWind.
export function DemandCard({ demanda, expanded = false, onToggle, onOpenDetails, onDelete, testID = 'demand-card' }: DemandCardProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityHint={expanded ? 'Recolhe os detalhes' : 'Mostra categoria e descrição'}
      className={`gap-3 rounded-2xl border bg-white p-3.5 shadow-sm active:opacity-90 ${expanded ? 'border-primary/40' : 'border-border'}`}
    >
      <View className="flex-row items-center gap-3">
        <DemandThumb category={demanda.category} photoUrl={demanda.photoUrl} testID={`${testID}-thumb`} />
        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 font-inter-bold text-sm text-text" numberOfLines={1}>
              {demanda.title}
            </Text>
            <StatusBadge status={demanda.status} testID={`${testID}-status`} />
          </View>
          <View className="flex-row items-center gap-1">
            <Icon name="map" size={11} color={palette.textMuted} />
            <Text className="flex-1 font-inter-medium text-xs text-textMuted" numberOfLines={1}>
              {demanda.location}
            </Text>
          </View>
          <Text className="font-inter-medium text-[10px] text-textSubtle">
            Registrado em: {formatarData(demanda.createdAt)}
            {demanda.region ? ` · ${REGIAO_LABELS[demanda.region]}` : ''}
          </Text>
        </View>
        {onDelete && (
          <Pressable
            testID={`${testID}-delete`}
            onPress={onDelete}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Excluir demanda ${demanda.title}`}
            className="h-7 w-7 items-center justify-center rounded-lg border border-danger bg-dangerSoft active:opacity-70"
          >
            <Icon name="trash" size={14} color={palette.danger} />
          </Pressable>
        )}
      </View>

      {expanded && (
        <View className="gap-2 border-t border-border pt-3" testID={`${testID}-details`}>
          <View className="flex-row items-center gap-1.5">
            <Text className="font-inter-bold text-[11px] uppercase text-primary">Categoria:</Text>
            <Text className="font-inter-medium text-xs text-text">{CATEGORIA_LABELS[demanda.category]}</Text>
          </View>
          <View className="gap-1">
            <Text className="font-inter-bold text-[11px] uppercase text-primary">Descrição do problema:</Text>
            <Text className="font-inter text-xs leading-4 text-textMuted">{demanda.description}</Text>
          </View>
          {onOpenDetails && (
            <Pressable
              testID={`${testID}-open`}
              onPress={onOpenDetails}
              hitSlop={8}
              accessibilityRole="link"
              className="mt-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-infoSoft py-2.5 active:opacity-80"
            >
              <Text className="font-inter-semibold text-xs text-primary">Ver detalhes da demanda</Text>
              <Icon name="chevronRight" size={14} color={colors.primary} />
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

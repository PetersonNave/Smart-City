import { Text, View } from 'react-native';
import type { DemandaStatus } from '../../types';
import { STATUS_META } from '../../domain/demanda';

export type StatusBadgeProps = {
  status: DemandaStatus;
  /** sm = card da lista (9px), md = card de detalhe (11px). */
  size?: 'sm' | 'md';
  testID?: string;
};

export function StatusBadge({ status, size = 'sm', testID }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const isMedium = size === 'md';

  return (
    <View
      testID={testID}
      className={`flex-row items-center gap-1 ${isMedium ? 'rounded-lg px-2.5 py-[5px]' : 'rounded-md px-2 py-1'}`}
      // Cores por status vêm do domínio (STATUS_META), não de classes fixas.
      style={{ backgroundColor: meta.background }}
    >
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      <Text
        className={`font-inter-extrabold tracking-wide ${isMedium ? 'text-[11px]' : 'text-[9px]'}`}
        style={{ color: meta.color }}
      >
        {meta.label.toUpperCase()}
      </Text>
    </View>
  );
}

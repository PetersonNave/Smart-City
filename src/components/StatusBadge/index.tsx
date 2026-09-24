import { StyleSheet, Text, View } from 'react-native';
import type { DemandaStatus } from '../../api/demandas';
import { STATUS_META } from '../../domain/demanda';
import { fonts } from '../../theme';

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
      style={[styles.badge, isMedium && styles.badgeMedium, { backgroundColor: meta.background }]}
    >
      <Text style={[styles.label, isMedium && styles.labelMedium, { color: meta.color }]}>
        {meta.label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  label: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 9,
  },
  labelMedium: {
    fontSize: 11,
  },
});

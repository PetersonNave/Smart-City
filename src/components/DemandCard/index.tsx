import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Demanda } from '../../api/demandas';
import { CATEGORIA_LABELS, formatarData } from '../../domain/demanda';
import { colors, fonts, palette } from '../../theme';
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

// Figma "demand-card" (frame "Analisar Demandas").
export function DemandCard({ demanda, expanded = false, onToggle, onOpenDetails, onDelete, testID = 'demand-card' }: DemandCardProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityHint={expanded ? 'Recolhe os detalhes' : 'Mostra categoria e descrição'}
      style={styles.card}
    >
      <View style={styles.header}>
        <DemandThumb category={demanda.category} />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {demanda.title}
            </Text>
            <StatusBadge status={demanda.status} testID={`${testID}-status`} />
          </View>
          <Text style={styles.location} numberOfLines={1}>
            {demanda.location}
          </Text>
          <Text style={styles.date}>Registrado em: {formatarData(demanda.createdAt)}</Text>
        </View>
        {onDelete && (
          <Pressable
            testID={`${testID}-delete`}
            onPress={onDelete}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Excluir demanda ${demanda.title}`}
            style={styles.deleteButton}
          >
            <Icon name="trash" size={14} color={palette.danger} />
          </Pressable>
        )}
      </View>

      {expanded && (
        <View style={styles.details} testID={`${testID}-details`}>
          <View style={styles.inlineRow}>
            <Text style={styles.detailLabel}>Categoria:</Text>
            <Text style={styles.detailValue}>{CATEGORIA_LABELS[demanda.category]}</Text>
          </View>
          <View style={styles.block}>
            <Text style={styles.detailLabel}>Descrição do problema:</Text>
            <Text style={styles.description}>{demanda.description}</Text>
          </View>
          {onOpenDetails && (
            <Pressable
              testID={`${testID}-open`}
              onPress={onOpenDetails}
              hitSlop={8}
              accessibilityRole="link"
              style={styles.link}
            >
              <Icon name="map" size={14} color={colors.primary} />
              <Text style={styles.linkText}>Toque para ver os detalhes da demanda</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: fonts.inter.bold,
    fontSize: 14,
    color: palette.text,
  },
  location: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: palette.textMuted,
  },
  date: {
    fontFamily: fonts.inter.medium,
    fontSize: 10,
    color: palette.textSubtle,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.danger,
    backgroundColor: palette.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    borderTopWidth: 1,
    borderColor: palette.border,
    paddingTop: 12,
    gap: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  block: {
    gap: 4,
  },
  detailLabel: {
    fontFamily: fonts.inter.bold,
    fontSize: 11,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: palette.text,
  },
  description: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    lineHeight: 16,
    color: palette.textMuted,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  linkText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 11,
    color: colors.primary,
  },
});

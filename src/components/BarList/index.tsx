import { Text, View } from 'react-native';

export type BarItem = { key: string; label: string; value: number; color: string };

type BarListProps = {
  title: string;
  items: BarItem[];
  testID?: string;
  /** Formatação do número exibido (ex.: milhar pt-BR); padrão é o valor cru. */
  formatValue?: (value: number) => string;
};

/** Card com barras horizontais proporcionais ao maior valor da lista. */
export function BarList({ title, items, testID, formatValue = String }: BarListProps) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <View className="gap-3 rounded-card bg-white p-5 shadow-md" testID={testID}>
      <Text className="font-inter-bold text-xs uppercase text-primary">{title}</Text>
      {items.map((item) => (
        <View key={item.key} className="gap-1" accessible accessibilityLabel={`${item.label}: ${formatValue(item.value)}`}>
          <View className="flex-row justify-between gap-3">
            <Text className="flex-1 font-inter-medium text-[13px] text-text" numberOfLines={1}>
              {item.label}
            </Text>
            <Text className="font-inter-bold text-[13px] text-text">{formatValue(item.value)}</Text>
          </View>
          <View className="h-2 overflow-hidden rounded bg-surfaceMuted">
            {/* Largura proporcional ao maior valor: calculada, por isso em style. */}
            <View className="h-2 rounded" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }} />
          </View>
        </View>
      ))}
    </View>
  );
}

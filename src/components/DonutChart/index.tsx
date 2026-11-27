import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '../../theme';

export type DonutSlice = { key: string; value: number; color: string };

type DonutChartProps = {
  slices: DonutSlice[];
  centerValue: string;
  centerLabel: string;
  size?: number;
  testID?: string;
};

const STROKE = 22;

/** Rosca em SVG: cada fatia é um arco do mesmo círculo, deslocado pelo acumulado das anteriores. */
export function DonutChart({ slices, centerValue, centerLabel, size = 180, testID }: DonutChartProps) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  let accumulated = 0;
  const arcs = slices
    .filter((slice) => slice.value > 0 && total > 0)
    .map((slice) => {
      const length = (slice.value / total) * circumference;
      const arc = { ...slice, length, offset: -accumulated };
      accumulated += length;
      return arc;
    });

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }} testID={testID}>
      {/* -90°: o primeiro arco começa no topo, como no dashboard. */}
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={palette.surfaceMuted} strokeWidth={STROKE} fill="none" />
        {arcs.map((arc) => (
          <Circle
            key={arc.key}
            testID={`donut-slice-${arc.key}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={arc.color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${arc.length} ${circumference - arc.length}`}
            strokeDashoffset={arc.offset}
          />
        ))}
      </Svg>
      <View className="absolute items-center">
        <Text className="font-inter-extrabold text-2xl text-navy">{centerValue}</Text>
        <Text className="font-inter-medium text-xs text-textMuted">{centerLabel}</Text>
      </View>
    </View>
  );
}

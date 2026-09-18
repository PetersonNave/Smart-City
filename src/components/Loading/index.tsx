import { ActivityIndicator } from 'react-native';
import { colors } from '../../theme';

export type LoadingProps = {
  size?: 'small' | 'large';
  color?: string;
  testID?: string;
};

export function Loading({ size = 'large', color = colors.primary, testID }: LoadingProps) {
  return <ActivityIndicator size={size} color={color} testID={testID} />;
}

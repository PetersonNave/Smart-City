import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const mockReact = require('react');
    const mockView = require('react-native').View;
    return mockReact.createElement(mockView, props, children);
  },
}));

import { GradientBackground } from './index';
import { colors } from '../../theme';

describe('GradientBackground', () => {
  it('renders its children', () => {
    const { getByText } = render(
      <GradientBackground>
        <Text>Oi</Text>
      </GradientBackground>
    );
    expect(getByText('Oi')).toBeTruthy();
  });

  it('uses the brand gradient colors in order', () => {
    const { getByTestId } = render(<GradientBackground testID="gradient" />);
    expect(getByTestId('gradient').props.colors).toEqual([colors.secondary, colors.primary, colors.navy]);
  });
});

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
describe('GradientBackground', () => {
  it('renders its children', () => {
    const { getByText } = render(
      <GradientBackground>
        <Text>Oi</Text>
      </GradientBackground>
    );
    expect(getByText('Oi')).toBeTruthy();
  });

  it('uses the Figma brand gradient (green → teal → navy at 90%) by default', () => {
    const { getByTestId } = render(<GradientBackground testID="gradient" />);
    expect(getByTestId('gradient').props.colors).toEqual([
      'rgba(86, 197, 150, 0.9)',
      'rgba(50, 157, 156, 0.9)',
      'rgba(32, 80, 114, 0.9)',
    ]);
  });

  it('uses the teal → green gradient for the screen variant', () => {
    const { getByTestId } = render(<GradientBackground variant="screen" testID="gradient" />);
    expect(getByTestId('gradient').props.colors).toEqual([
      'rgba(50, 157, 156, 0.9)',
      'rgba(86, 197, 150, 0.9)',
    ]);
  });
});

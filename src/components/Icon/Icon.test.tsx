import { render } from '@testing-library/react-native';
import { Icon, type IconName } from './index';

describe('Icon', () => {
  it('renders without throwing for every mapped icon name', () => {
    const names: IconName[] = ['home', 'map', 'demands', 'profile', 'mail', 'lock', 'eye', 'eyeOff'];
    names.forEach((name) => {
      expect(() => render(<Icon name={name} />)).not.toThrow();
    });
  });

  it('forwards size and color to the underlying svg', () => {
    const { getByTestId } = render(<Icon name="mail" size={32} color="#205072" testID="icon-mail" />);
    const element = getByTestId('icon-mail');
    expect(element.props.width).toBe(32);
    expect(element.props.height).toBe(32);
    expect(element.props.stroke).toBe('#205072');
  });
});

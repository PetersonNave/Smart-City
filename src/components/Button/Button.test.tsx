import { fireEvent, render } from '@testing-library/react-native';
import { Button } from './index';

describe('Button', () => {
  it('calls onPress when pressed and enabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<Button label="Entrar" onPress={onPress} testID="btn" />);

    fireEvent.press(getByTestId('btn'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button label="Entrar" onPress={onPress} disabled testID="btn" />,
    );

    fireEvent.press(getByTestId('btn'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading indicator and blocks presses while loading', () => {
    const onPress = jest.fn();
    const { getByTestId, queryByText } = render(
      <Button label="Entrar" onPress={onPress} loading testID="btn" />,
    );

    fireEvent.press(getByTestId('btn'));

    expect(onPress).not.toHaveBeenCalled();
    expect(queryByText('Entrar')).toBeNull();
  });
});

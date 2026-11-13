import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { Button } from './index';

describe('Button', () => {
  it('calls onPress when pressed and enabled', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(<Button label="Entrar" onPress={onPress} testID="btn" />);

    await fireEvent.press(getByTestId('btn'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <Button label="Entrar" onPress={onPress} disabled testID="btn" />,
    );

    await fireEvent.press(getByTestId('btn'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading indicator and blocks presses while loading', async () => {
    const onPress = jest.fn();
    const { getByTestId, queryByText } = await render(
      <Button label="Entrar" onPress={onPress} loading testID="btn" />,
    );

    await fireEvent.press(getByTestId('btn'));

    expect(onPress).not.toHaveBeenCalled();
    expect(queryByText('Entrar')).toBeNull();
  });

  it('renders the danger variant with the Figma red background', async () => {
    const { getByTestId } = await render(<Button label="Excluir" variant="danger" onPress={jest.fn()} testID="btn" />);

    expect(StyleSheet.flatten(getByTestId('btn').props.style).backgroundColor).toBe('#EF5350');
  });
});

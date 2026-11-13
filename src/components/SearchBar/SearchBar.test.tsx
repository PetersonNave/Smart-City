import { fireEvent, render, screen } from '@testing-library/react-native';
import { SearchBar } from './index';

describe('SearchBar', () => {
  it('reports what the user types', async () => {
    const onChangeText = jest.fn();
    await render(<SearchBar value="" onChangeText={onChangeText} testID="busca" />);

    await fireEvent.changeText(screen.getByTestId('busca-input'), 'semaforo');

    expect(onChangeText).toHaveBeenCalledWith('semaforo');
  });

  it('shows the clear button only with text, and clearing empties the value', async () => {
    const onChangeText = jest.fn();
    const { rerender } = await render(<SearchBar value="" onChangeText={onChangeText} testID="busca" />);
    expect(screen.queryByTestId('busca-clear')).toBeNull();

    await rerender(<SearchBar value="poste" onChangeText={onChangeText} testID="busca" />);
    await fireEvent.press(screen.getByTestId('busca-clear'));

    expect(onChangeText).toHaveBeenCalledWith('');
  });
});

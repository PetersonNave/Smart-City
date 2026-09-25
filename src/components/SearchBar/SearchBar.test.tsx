import { fireEvent, render, screen } from '@testing-library/react-native';
import { SearchBar } from './index';

describe('SearchBar', () => {
  it('reports what the user types', () => {
    const onChangeText = jest.fn();
    render(<SearchBar value="" onChangeText={onChangeText} testID="busca" />);

    fireEvent.changeText(screen.getByTestId('busca-input'), 'semaforo');

    expect(onChangeText).toHaveBeenCalledWith('semaforo');
  });

  it('shows the clear button only with text, and clearing empties the value', () => {
    const onChangeText = jest.fn();
    const { rerender } = render(<SearchBar value="" onChangeText={onChangeText} testID="busca" />);
    expect(screen.queryByTestId('busca-clear')).toBeNull();

    rerender(<SearchBar value="poste" onChangeText={onChangeText} testID="busca" />);
    fireEvent.press(screen.getByTestId('busca-clear'));

    expect(onChangeText).toHaveBeenCalledWith('');
  });
});

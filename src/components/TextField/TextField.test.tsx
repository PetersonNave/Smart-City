import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { TextField } from './index';

describe('TextField', () => {
  it('calls onChangeText as the user types', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <TextField label="Email" value="" onChangeText={onChangeText} testID="field-email" />,
    );

    fireEvent.changeText(getByTestId('field-email-input'), 'a@b.com');

    expect(onChangeText).toHaveBeenCalledWith('a@b.com');
  });

  it('shows the error message when error is set', () => {
    const { getByText } = render(
      <TextField
        label="Email"
        value=""
        onChangeText={jest.fn()}
        error="E-mail inválido"
        testID="field-email"
      />,
    );

    expect(getByText('E-mail inválido')).toBeTruthy();
  });

  it('does not render an error message when there is no error', () => {
    const { queryByTestId } = render(
      <TextField label="Email" value="" onChangeText={jest.fn()} testID="field-email" />,
    );

    expect(queryByTestId('field-email-error')).toBeNull();
  });

  it('keeps the error border when an invalid field is focused', () => {
    const { getByTestId } = render(
      <TextField
        label="Email"
        value=""
        onChangeText={jest.fn()}
        error="E-mail inválido"
        testID="field-email"
      />,
    );

    fireEvent(getByTestId('field-email-input'), 'focus');

    expect(StyleSheet.flatten(getByTestId('field-email-field').props.style).borderColor).toBe('#E53935');
  });

  it('toggles password visibility for secureTextEntry fields', () => {
    const { getByTestId } = render(
      <TextField
        label="Senha"
        value="segredo"
        onChangeText={jest.fn()}
        secureTextEntry
        testID="field-senha"
      />,
    );
    const input = getByTestId('field-senha-input');

    expect(input.props.secureTextEntry).toBe(true);

    fireEvent.press(getByTestId('field-senha-toggle'));

    expect(input.props.secureTextEntry).toBe(false);
  });
});

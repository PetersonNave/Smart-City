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

    expect(StyleSheet.flatten(getByTestId('field-email-field').props.style).borderColor).toBe('#FF383C');
  });

  it('renders the placeholder inside the input and no label when label is omitted (Figma login)', () => {
    const { getByTestId, queryByText } = render(
      <TextField placeholder="Email" value="" onChangeText={jest.fn()} testID="field-email" />,
    );

    expect(getByTestId('field-email-input').props.placeholder).toBe('Email');
    expect(queryByText('Email')).toBeNull();
  });

  it('renders the label above a card field and supports multiline', () => {
    const { getByText, getByTestId } = render(
      <TextField
        variant="card"
        label="Descrição"
        placeholder="Descreva o problema encontrado"
        multiline
        value=""
        onChangeText={jest.fn()}
        testID="field-descricao"
      />,
    );

    expect(getByText('Descrição')).toBeTruthy();
    expect(getByTestId('field-descricao-input').props.multiline).toBe(true);
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

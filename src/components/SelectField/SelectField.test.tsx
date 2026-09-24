import { fireEvent, render, screen } from '@testing-library/react-native';
import { SelectField } from './index';

const options = [
  { value: 'PUBLIC_LIGHTING', label: 'Iluminação pública' },
  { value: 'SANITATION', label: 'Saneamento' },
] as const;

describe('SelectField', () => {
  it('shows the placeholder until a value is chosen', () => {
    render(
      <SelectField
        label="Categoria"
        placeholder="Selecione uma Categoria"
        value=""
        options={[...options]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Selecione uma Categoria')).toBeTruthy();
  });

  it('opens the option sheet and reports the chosen value', () => {
    const onChange = jest.fn();
    render(
      <SelectField
        label="Categoria"
        placeholder="Selecione uma Categoria"
        value=""
        options={[...options]}
        onChange={onChange}
        testID="categoria"
      />
    );

    fireEvent.press(screen.getByTestId('categoria-trigger'));
    fireEvent.press(screen.getByTestId('categoria-option-SANITATION'));

    expect(onChange).toHaveBeenCalledWith('SANITATION');
  });

  it('shows the selected label and the error message', () => {
    render(
      <SelectField
        label="Categoria"
        placeholder="Selecione uma Categoria"
        value="PUBLIC_LIGHTING"
        options={[...options]}
        onChange={jest.fn()}
        error="Selecione uma categoria"
        testID="categoria"
      />
    );

    expect(screen.getByText('Iluminação pública')).toBeTruthy();
    expect(screen.getByTestId('categoria-error')).toBeTruthy();
  });
});

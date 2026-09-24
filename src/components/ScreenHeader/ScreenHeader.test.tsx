import { fireEvent, render, screen } from '@testing-library/react-native';
import { ScreenHeader } from './index';

describe('ScreenHeader', () => {
  it('renders the title and calls onBack from the back button', () => {
    const onBack = jest.fn();
    render(<ScreenHeader title="Detalhe da Demanda" onBack={onBack} />);

    expect(screen.getByText('Detalhe da Demanda')).toBeTruthy();
    fireEvent.press(screen.getByTestId('screen-header-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('hides the back button when there is nowhere to go back to', () => {
    render(<ScreenHeader title="Minhas Demandas" />);
    expect(screen.queryByTestId('screen-header-back')).toBeNull();
  });
});

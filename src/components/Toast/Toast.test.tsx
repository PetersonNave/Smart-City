import { act, render, screen } from '@testing-library/react-native';
import { Toast } from './index';

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows the message and asks the owner to hide it after the duration', () => {
    const onHide = jest.fn();
    render(<Toast message="Demanda excluída com sucesso!" onHide={onHide} duration={3000} />);

    expect(screen.getByText('Demanda excluída com sucesso!')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('renders nothing without a message', () => {
    render(<Toast message={null} onHide={jest.fn()} />);
    expect(screen.queryByTestId('toast')).toBeNull();
  });
});

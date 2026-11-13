import { fireEvent, render, screen } from '@testing-library/react-native';
import { ConfirmModal } from './index';

describe('ConfirmModal', () => {
  const baseProps = {
    title: 'Excluir Demanda?',
    message: 'Esta ação não poderá ser desfeita.',
    confirmLabel: 'Excluir',
  };

  it('renders title and message when visible and wires both actions', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await render(<ConfirmModal {...baseProps} visible onConfirm={onConfirm} onCancel={onCancel} />);

    expect(screen.getByText('Excluir Demanda?')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('confirm-modal-confirm'));
    await fireEvent.press(screen.getByTestId('confirm-modal-cancel'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('blocks both actions while loading', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await render(<ConfirmModal {...baseProps} visible loading onConfirm={onConfirm} onCancel={onCancel} />);

    await fireEvent.press(screen.getByTestId('confirm-modal-confirm'));
    await fireEvent.press(screen.getByTestId('confirm-modal-cancel'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('renders nothing when hidden', async () => {
    await render(<ConfirmModal {...baseProps} visible={false} onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.queryByText('Excluir Demanda?')).toBeNull();
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Demanda } from '../../api/demandas';
import { DemandCard } from './index';

const demanda: Demanda = {
  id: 3,
  title: 'Semáforo danificado',
  description: 'Semáforo na esquina está apagado há 3 dias.',
  category: 'PUBLIC_LIGHTING',
  location: 'Rua XV de Novembro, 450',
  status: 'PENDING',
  priority: 'media',
  createdAt: '2026-10-15T12:00:00',
  updatedAt: null,
  photoUrl: null,
};

describe('DemandCard', () => {
  it('shows title, address, status and registration date', async () => {
    await render(<DemandCard demanda={demanda} />);

    expect(screen.getByText('Semáforo danificado')).toBeTruthy();
    expect(screen.getByText('Rua XV de Novembro, 450')).toBeTruthy();
    expect(screen.getByText('PENDENTE')).toBeTruthy();
    expect(screen.getByText('Registrado em: 15/10/2026')).toBeTruthy();
  });

  it('only shows category and description when expanded', async () => {
    const { rerender } = await render(<DemandCard demanda={demanda} />);
    expect(screen.queryByText('Iluminação pública')).toBeNull();

    await rerender(<DemandCard demanda={demanda} expanded />);
    expect(screen.getByText('Iluminação pública')).toBeTruthy();
    expect(screen.getByText(demanda.description)).toBeTruthy();
  });

  it('calls onToggle when the card is pressed and onOpenDetails from the expanded link', async () => {
    const onToggle = jest.fn();
    const onOpenDetails = jest.fn();
    await render(<DemandCard demanda={demanda} expanded onToggle={onToggle} onOpenDetails={onOpenDetails} />);

    await fireEvent.press(screen.getByTestId('demand-card'));
    await fireEvent.press(screen.getByTestId('demand-card-open'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onOpenDetails).toHaveBeenCalledTimes(1);
  });

  it('renders the trash button only when onDelete is provided', async () => {
    const onDelete = jest.fn();
    const { rerender } = await render(<DemandCard demanda={demanda} />);
    expect(screen.queryByTestId('demand-card-delete')).toBeNull();

    await rerender(<DemandCard demanda={demanda} onDelete={onDelete} />);
    await fireEvent.press(screen.getByTestId('demand-card-delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

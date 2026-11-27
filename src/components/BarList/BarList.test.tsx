import { render, screen } from '@testing-library/react-native';
import { BarList } from './index';

describe('BarList', () => {
  it('renders the title and each bar with its accessible value', async () => {
    await render(
      <BarList
        title="Serviços mais solicitados"
        testID="lista"
        formatValue={(n) => n.toLocaleString('pt-BR')}
        items={[
          { key: 'ilum', label: 'Iluminação', value: 4118, color: '#000' },
          { key: 'limp', label: 'Limpeza', value: 2584, color: '#000' },
        ]}
      />
    );

    expect(screen.getByText('Serviços mais solicitados')).toBeTruthy();
    expect(screen.getByLabelText('Iluminação: 4.118')).toBeTruthy();
    expect(screen.getByText('2.584')).toBeTruthy();
  });

  it('shows raw numbers without a formatter', async () => {
    await render(<BarList title="Por região" items={[{ key: 'c', label: 'Centro', value: 4, color: '#000' }]} />);
    expect(screen.getByLabelText('Centro: 4')).toBeTruthy();
  });
});

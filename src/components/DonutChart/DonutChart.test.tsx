import { render, screen } from '@testing-library/react-native';
import { DonutChart } from './index';

describe('DonutChart', () => {
  it('shows the center value and label', async () => {
    await render(
      <DonutChart
        testID="rosca"
        centerValue="11.374"
        centerLabel="solicitações"
        slices={[
          { key: 'a', value: 7662, color: '#13957f' },
          { key: 'b', value: 3712, color: '#3b79ba' },
        ]}
      />
    );

    expect(screen.getByTestId('rosca')).toBeTruthy();
    expect(screen.getByText('11.374')).toBeTruthy();
    expect(screen.getByText('solicitações')).toBeTruthy();
  });

  it('draws one arc per non-empty slice', async () => {
    await render(
      <DonutChart
        centerValue="3"
        centerLabel="x"
        slices={[
          { key: 'a', value: 2, color: '#111' },
          { key: 'b', value: 0, color: '#222' },
          { key: 'c', value: 1, color: '#333' },
        ]}
      />
    );
    expect(screen.getByTestId('donut-slice-a')).toBeTruthy();
    expect(screen.queryByTestId('donut-slice-b')).toBeNull();
    expect(screen.getByTestId('donut-slice-c')).toBeTruthy();
  });

  it('does not break when every slice is zero', async () => {
    await render(<DonutChart centerValue="0" centerLabel="solicitações" slices={[{ key: 'a', value: 0, color: '#111' }]} />);
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByTestId('donut-slice-a')).toBeNull();
  });
});

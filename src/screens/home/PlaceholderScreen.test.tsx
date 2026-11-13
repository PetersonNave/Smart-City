import { render, screen } from '@testing-library/react-native';
import { PlaceholderScreen } from './PlaceholderScreen';

describe('PlaceholderScreen', () => {
  it('renders the given title and an "em construção" note', async () => {
    await render(<PlaceholderScreen title="Mapa" />);

    expect(screen.getByText('Mapa')).toBeTruthy();
    expect(screen.getByText('Em construção')).toBeTruthy();
  });
});

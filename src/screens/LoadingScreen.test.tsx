import { render, screen } from '@testing-library/react-native';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders the logo and a spinner', () => {
    render(<LoadingScreen />);

    expect(screen.getByTestId('loading-logo')).toBeTruthy();
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });
});

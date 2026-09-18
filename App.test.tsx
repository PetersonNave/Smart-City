import { render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('./src/auth/storage');

import { getStoredTokens } from './src/auth/storage';
import App from './App';

describe('App', () => {
  it('boots to the auth stack when there is no stored session', async () => {
    (getStoredTokens as jest.Mock).mockResolvedValue(null);
    render(<App />);

    await waitFor(() => expect(screen.getByText('Login')).toBeTruthy());
  });
});

import { render } from '@testing-library/react-native';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('./src/theme', () => ({
  colors: { navy: '#000' },
  fontAssets: {},
  fonts: { inter: { extraBold: 'test', medium: 'test' } },
}));

import App from './App';

describe('App', () => {
  it('renders without crashing once fonts are loaded', () => {
    expect(() => render(<App />)).not.toThrow();
  });
});

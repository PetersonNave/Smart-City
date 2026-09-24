import { renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { formatAddress, useCurrentAddress } from './useCurrentAddress';

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

describe('formatAddress', () => {
  it('builds "street, number - district"', () => {
    expect(
      formatAddress({
        street: 'Rua XV de Novembro',
        streetNumber: '450',
        district: 'Centro',
        city: 'Curitiba',
        name: null,
        formattedAddress: null,
      })
    ).toBe('Rua XV de Novembro, 450 - Centro');
  });

  it('falls back to the formatted address when there is no street', () => {
    expect(
      formatAddress({
        street: null,
        streetNumber: null,
        district: null,
        city: null,
        name: 'Praça Tiradentes',
        formattedAddress: 'Praça Tiradentes, Curitiba - PR',
      })
    ).toBe('Praça Tiradentes, Curitiba - PR');
  });
});

describe('useCurrentAddress', () => {
  afterEach(() => jest.clearAllMocks());

  it('resolves the reverse-geocoded address when permission is granted', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: -25.43, longitude: -49.27 },
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
      { street: 'Rua XV de Novembro', streetNumber: '450', district: null },
    ]);

    const { result } = renderHook(() => useCurrentAddress());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.address).toBe('Rua XV de Novembro, 450');
  });

  it('reports "denied" and never asks the GPS when permission is refused', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });

    const { result } = renderHook(() => useCurrentAddress());

    await waitFor(() => expect(result.current.status).toBe('denied'));
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });
});

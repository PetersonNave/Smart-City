import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type AddressStatus = 'locating' | 'ready' | 'denied' | 'error';

type GeocodedAddress = Pick<
  Location.LocationGeocodedAddress,
  'street' | 'streetNumber' | 'district' | 'city' | 'name' | 'formattedAddress'
>;

/** "Rua XV de Novembro, 450 - Centro" a partir do reverse geocoding (cai para o nome/endereço completo). */
export function formatAddress(address: GeocodedAddress | undefined): string | null {
  if (!address) return null;
  if (address.street) {
    const main = address.streetNumber ? `${address.street}, ${address.streetNumber}` : address.street;
    return address.district ? `${main} - ${address.district}` : main;
  }
  return address.formattedAddress ?? address.name ?? null;
}

/**
 * Captura a posição atual (permissão "em uso") e converte em endereço legível.
 * Se o usuário negar a permissão ou o GPS falhar, o formulário cai para digitação manual.
 */
export function useCurrentAddress() {
  const [status, setStatus] = useState<AddressStatus>('locating');
  const [address, setAddress] = useState<string | null>(null);

  const locate = useCallback(async () => {
    setStatus('locating');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setStatus('denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      const [geocoded] = await Location.reverseGeocodeAsync({ latitude, longitude });
      setAddress(formatAddress(geocoded) ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return { status, address, retry: locate };
}

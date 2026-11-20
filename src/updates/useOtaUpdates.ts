import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Procura uma atualização OTA publicada com `eas update` no canal do build e, se houver,
 * baixa em segundo plano. Retorna `true` quando há uma versão nova pronta para aplicar.
 * Em desenvolvimento (Expo Go / dev client) o expo-updates fica desligado.
 */
export async function checkAndFetchUpdate(): Promise<boolean> {
  if (__DEV__ || !Updates.isEnabled) return false;
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return false;
    const result = await Updates.fetchUpdateAsync();
    return result.isNew;
  } catch {
    // Sem rede ou servidor de updates fora do ar: continua com o bundle atual.
    return false;
  }
}

/** Verifica updates ao abrir o app e pergunta antes de reiniciar (não perde o que o usuário digitava). */
export function useOtaUpdates() {
  useEffect(() => {
    let active = true;
    checkAndFetchUpdate().then((ready) => {
      if (!active || !ready) return;
      Alert.alert('Atualização disponível', 'Uma nova versão do ResolveAí foi baixada. Reiniciar agora?', [
        { text: 'Depois', style: 'cancel' },
        {
          text: 'Reiniciar',
          onPress: () => {
            Updates.reloadAsync().catch(() => undefined);
          },
        },
      ]);
    });
    return () => {
      active = false;
    };
  }, []);
}

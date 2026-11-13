import { useState } from 'react';
import { Alert } from 'react-native';
import { usePreventRemove } from 'expo-router/react-navigation';

/**
 * Enquanto `shouldConfirm` for true, sair da tela (botão voltar, gesto do iOS ou botão
 * físico do Android) pede confirmação antes de descartar o que foi preenchido.
 */
export function useDiscardGuard(shouldConfirm: boolean, title: string, message = 'As informações preenchidas serão perdidas.') {
  // expo-router 58: para seguir com a saída bloqueada, desliga-se o bloqueio e chama-se
  // `repeat()` (antes era `navigation.dispatch(data.action)`).
  const [discarded, setDiscarded] = useState(false);

  usePreventRemove(shouldConfirm && !discarded, ({ repeat }) => {
    Alert.alert(title, message, [
      { text: 'Continuar editando', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          setDiscarded(true);
          repeat();
        },
      },
    ]);
  });
}

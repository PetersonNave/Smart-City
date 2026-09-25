import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';

/**
 * Enquanto `shouldConfirm` for true, sair da tela (botão voltar, gesto do iOS ou botão
 * físico do Android) pede confirmação antes de descartar o que foi preenchido.
 */
export function useDiscardGuard(shouldConfirm: boolean, title: string, message = 'As informações preenchidas serão perdidas.') {
  const navigation = useNavigation();

  usePreventRemove(shouldConfirm, ({ data }) => {
    Alert.alert(title, message, [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });
}

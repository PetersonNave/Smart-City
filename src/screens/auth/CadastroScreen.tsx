import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Cadastro'>;

export function CadastroScreen({ navigation }: Props) {
  return (
    <View>
      <Text>Cadastro</Text>
      <Pressable testID="go-to-login" onPress={() => navigation.navigate('Login')}>
        <Text>Entrar</Text>
      </Pressable>
    </View>
  );
}

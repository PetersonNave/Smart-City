import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <View>
      <Text>Login</Text>
      <Pressable testID="go-to-cadastro" onPress={() => navigation.navigate('Cadastro')}>
        <Text>Cadastre-se</Text>
      </Pressable>
    </View>
  );
}

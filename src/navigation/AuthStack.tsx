import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CadastroScreen } from '../screens/auth/CadastroScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';

export type AuthStackParamList = {
  Login: undefined;
  Cadastro: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Cadastro" component={CadastroScreen} />
    </Stack.Navigator>
  );
}

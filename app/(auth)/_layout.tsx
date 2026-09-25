import { Stack } from 'expo-router';

// Login é a primeira tela do grupo (sem isso, "cadastro" viria antes em ordem alfabética).
export const unstable_settings = {
  initialRouteName: 'login',
};

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

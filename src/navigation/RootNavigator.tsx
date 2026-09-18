import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { LoadingScreen } from '../screens/LoadingScreen';
import { AppTabs } from './AppTabs';
import { AuthStack } from './AuthStack';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { status } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'bootstrapping' && <Stack.Screen name="Loading" component={LoadingScreen} />}
      {status === 'guest' && <Stack.Screen name="Auth" component={AuthStack} />}
      {status === 'authenticated' && <Stack.Screen name="App" component={AppTabs} />}
    </Stack.Navigator>
  );
}

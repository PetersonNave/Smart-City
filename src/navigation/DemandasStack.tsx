import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DemandaDetalheScreen } from '../screens/demandas/DemandaDetalheScreen';
import { DemandasListaScreen } from '../screens/demandas/DemandasListaScreen';
import type { DemandasStackParamList } from './types';

const Stack = createNativeStackNavigator<DemandasStackParamList>();

export function DemandasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DemandasLista" component={DemandasListaScreen} />
      <Stack.Screen name="DemandaDetalhe" component={DemandaDetalheScreen} />
    </Stack.Navigator>
  );
}

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DemandaEnviadaScreen } from '../screens/demandas/DemandaEnviadaScreen';
import { NovaDemandaScreen } from '../screens/demandas/NovaDemandaScreen';
import { AppTabs } from './AppTabs';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

// Telas de fluxo (Nova demanda / Demanda enviada) ficam acima das abas: no Figma elas não têm tab bar.
export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="NovaDemanda" component={NovaDemandaScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="DemandaEnviada" component={DemandaEnviadaScreen} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}

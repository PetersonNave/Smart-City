import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { IconName } from '../components/Icon';
import { TabBar } from '../components/TabBar';
import { HomeScreen } from '../screens/home/HomeScreen';
import { PlaceholderScreen } from '../screens/home/PlaceholderScreen';
import { DemandasStack } from './DemandasStack';
import type { AppTabsParamList } from './types';

export type { AppTabsParamList } from './types';

const Tab = createBottomTabNavigator<AppTabsParamList>();

const TAB_ICONS: Record<keyof AppTabsParamList, IconName> = {
  Inicio: 'home',
  Mapa: 'map',
  Demandas: 'demands',
  Perfil: 'profile',
};

function MapaScreen() {
  return <PlaceholderScreen title="Mapa" />;
}

function PerfilScreen() {
  return <PlaceholderScreen title="Perfil" />;
}

export function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} icons={TAB_ICONS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Mapa" component={MapaScreen} options={{ title: 'Mapa' }} />
      <Tab.Screen name="Demandas" component={DemandasStack} options={{ title: 'Demandas' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

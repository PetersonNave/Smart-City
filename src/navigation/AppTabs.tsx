import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon, type IconName } from '../components/Icon';
import { HomeScreen } from '../screens/home/HomeScreen';
import { PlaceholderScreen } from '../screens/home/PlaceholderScreen';
import { colors } from '../theme';

export type AppTabsParamList = {
  Inicio: undefined;
  Mapa: undefined;
  Demandas: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

const TAB_ICONS: Record<keyof AppTabsParamList, IconName> = {
  Inicio: 'home',
  Mapa: 'map',
  Demandas: 'demands',
  Perfil: 'profile',
};

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#90A4AE',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <Icon name={TAB_ICONS[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Mapa" options={{ title: 'Mapa' }}>
        {() => <PlaceholderScreen title="Mapa" />}
      </Tab.Screen>
      <Tab.Screen name="Demandas" options={{ title: 'Demandas' }}>
        {() => <PlaceholderScreen title="Demandas" />}
      </Tab.Screen>
      <Tab.Screen name="Perfil" options={{ title: 'Perfil' }}>
        {() => <PlaceholderScreen title="Perfil" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

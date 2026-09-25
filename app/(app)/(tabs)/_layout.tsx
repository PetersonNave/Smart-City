import { Tabs } from 'expo-router';
import type { IconName } from '../../../src/components/Icon';
import { TabBar } from '../../../src/components/TabBar';

// Nome da rota (arquivo) → ícone da TabBar do Figma.
const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  mapa: 'map',
  demandas: 'demands',
  perfil: 'profile',
};

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} icons={TAB_ICONS} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="mapa" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="demandas" options={{ title: 'Demandas' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

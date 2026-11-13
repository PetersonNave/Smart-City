import { Stack } from 'expo-router';
import { useDemandNotifications } from '../../src/notifications/useDemandNotifications';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Telas de fluxo (Nova demanda / Demanda enviada) ficam acima das abas: no Figma elas não têm tab bar.
// As notificações só são ligadas aqui, dentro da área logada.
export default function AppLayout() {
  useDemandNotifications();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="nova-demanda" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="demanda-enviada" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

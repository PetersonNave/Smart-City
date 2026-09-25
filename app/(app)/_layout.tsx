import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Telas de fluxo (Nova demanda / Demanda enviada) ficam acima das abas: no Figma elas não têm tab bar.
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="nova-demanda" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="demanda-enviada" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

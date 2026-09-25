import { Stack } from 'expo-router';

// Garante a lista embaixo do detalhe mesmo quando se chega direto em /demandas/:id
// (ex.: "Acompanhar demanda"), para o "voltar" levar à lista.
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function DemandasLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

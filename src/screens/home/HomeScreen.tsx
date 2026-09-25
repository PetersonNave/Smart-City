import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { routes } from '../../navigation/routes';
import { colors, fonts, palette } from '../../theme';

export function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.greeting}>Olá, {user?.name ?? 'visitante'}!</Text>
      <Text style={styles.subtitle}>Bem-vindo(a) de volta ao ResolveAí.</Text>
      <Button
        label="Registrar nova demanda"
        icon="plus"
        onPress={() => router.push(routes.novaDemanda)}
        testID="home-nova-demanda"
      />
      <Button label="Sair" variant="secondary" onPress={() => logout()} testID="home-logout" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  greeting: { fontFamily: fonts.inter.extraBold, fontSize: 24, color: colors.navy },
  subtitle: { fontFamily: fonts.inter.regular, fontSize: 16, color: palette.textSubtle, marginBottom: 24 },
});

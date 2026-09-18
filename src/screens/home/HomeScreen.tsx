import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { colors, fonts } from '../../theme';

export function HomeScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.greeting}>Olá, {user?.name ?? 'visitante'}!</Text>
      <Text style={styles.subtitle}>Bem-vindo(a) de volta ao ResolveAí.</Text>
      <Button label="Sair" variant="secondary" onPress={() => logout()} testID="home-logout" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  greeting: { fontFamily: fonts.inter.extraBold, fontSize: 24, color: colors.navy },
  subtitle: { fontFamily: fonts.inter.regular, fontSize: 16, color: '#90A4AE', marginBottom: 24 },
});

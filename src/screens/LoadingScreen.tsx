import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '../components/GradientBackground';
import { Loading } from '../components/Loading';
import { palette } from '../theme';

// Figma "iPhone 16 Plus - 2": gradiente da marca + logo de 257px centralizado.
export function LoadingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground style={styles.container}>
      <Image
        testID="loading-logo"
        source={require('../../assets/images/logo-resolveai.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="ResolveAí"
      />
      {/* O Figma não tem indicador; fica discreto no rodapé para sinalizar que o app não travou. */}
      <View style={[styles.spinner, { bottom: insets.bottom + 48 }]}>
        <Loading size="small" color={palette.white} testID="loading-spinner" />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  logo: { width: 257, height: 257 },
  spinner: { position: 'absolute', alignSelf: 'center' },
});

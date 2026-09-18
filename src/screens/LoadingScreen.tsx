import { Image, StyleSheet } from 'react-native';
import { GradientBackground } from '../components/GradientBackground';
import { Loading } from '../components/Loading';

export function LoadingScreen() {
  return (
    <GradientBackground style={styles.container}>
      <Image
        testID="loading-logo"
        source={require('../../assets/icons/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Loading color="#fff" testID="loading-spinner" />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: 24 },
  logo: { width: 160, height: 160 },
});

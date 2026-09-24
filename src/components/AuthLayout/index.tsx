import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '../GradientBackground';
import { colors, fonts, palette } from '../../theme';

// Medidas do frame "Login" do Figma (390×812): logo 181px a 50px do topo,
// folha cinza começando em y=289 com cantos de 50px e título a 50px do topo da folha.
const STATUS_BAR_HEIGHT = 44;
const LOGO_SIZE = 181;
const LOGO_TOP = 50;
const SHEET_TOP = 289;

export type AuthLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();
  // O Figma considera uma status bar de 44px; em aparelhos com notch maior, empurra tudo pra baixo.
  const extraTop = Math.max(insets.top - STATUS_BAR_HEIGHT, 0);

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={[styles.header, { height: SHEET_TOP + extraTop, paddingTop: LOGO_TOP + extraTop }]}>
            <Image
              testID="auth-logo"
              source={require('../../../assets/images/logo-resolveai.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="ResolveAí"
            />
          </View>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 32 }]}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: palette.authSheet,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingTop: 50,
    paddingHorizontal: 39,
    alignItems: 'center',
    // Aproxima a sombra interna do Figma (inset 0 2 6 rgba(0,0,0,.2)), que o RN não suporta.
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  title: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 36,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 49,
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { GradientBackground } from '../../components/GradientBackground';
import { ScreenHeader } from '../../components/ScreenHeader';
import { formatarData, isGestor, perfilLabel } from '../../domain/demanda';
import { colors, fonts, palette } from '../../theme';

// Dados da conta logada, o perfil de acesso (Cidadão x Gestor Público) e o logout.
export function PerfilScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const gestor = isGestor(user);
  const inicial = (user?.name ?? '?').trim().charAt(0).toUpperCase();

  return (
    <GradientBackground variant="screen" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Perfil" testID="perfil-header" />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{inicial}</Text>
          </View>
          <Text style={styles.name} testID="perfil-nome">
            {user?.name}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.badge, gestor ? styles.badgeGestor : styles.badgeCidadao]} testID="perfil-role">
            <Text style={[styles.badgeText, gestor ? styles.badgeTextGestor : styles.badgeTextCidadao]}>
              {perfilLabel(user?.role)}
            </Text>
          </View>
          {user?.createdAt ? <Text style={styles.since}>Conta criada em {formatarData(user.createdAt)}</Text> : null}
          <Text style={styles.description}>
            {gestor
              ? 'Você analisa as demandas de toda a cidade, altera o status das ocorrências e acompanha os indicadores no painel.'
              : 'Você registra problemas da cidade e acompanha o andamento das suas demandas. Avisaremos quando o status mudar.'}
          </Text>
        </View>
        <Button label="Sair da conta" variant="surface" onPress={() => logout()} testID="perfil-logout" />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  card: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 24,
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.infoSoft,
    marginBottom: 4,
  },
  avatarText: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 30,
    color: colors.navy,
  },
  name: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 20,
    color: palette.text,
  },
  email: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: palette.textMuted,
  },
  badge: {
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  badgeCidadao: {
    backgroundColor: palette.successSoft,
  },
  badgeGestor: {
    backgroundColor: palette.infoSoft,
  },
  badgeText: {
    fontFamily: fonts.inter.bold,
    fontSize: 13,
  },
  badgeTextCidadao: {
    color: palette.successStrong,
  },
  badgeTextGestor: {
    color: colors.navy,
  },
  since: {
    fontFamily: fonts.inter.medium,
    fontSize: 13,
    color: palette.textSubtle,
  },
  description: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});

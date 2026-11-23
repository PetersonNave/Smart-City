import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { GradientBackground } from '../../components/GradientBackground';
import { Icon, type IconName } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { formatarData, isGestor, perfilLabel } from '../../domain/demanda';
import { colors } from '../../theme';

const PERMISSOES: Record<'cidadao' | 'gestor', { icon: IconName; text: string }[]> = {
  cidadao: [
    { icon: 'camera', text: 'Registrar demandas com foto e localização' },
    { icon: 'demands', text: 'Acompanhar o status das suas demandas' },
    { icon: 'bell', text: 'Receber aviso quando o status mudar' },
  ],
  gestor: [
    { icon: 'demands', text: 'Analisar as demandas de toda a cidade' },
    { icon: 'check', text: 'Alterar o status das ocorrências' },
    { icon: 'search', text: 'Acompanhar indicadores no painel' },
  ],
};

// Dados da conta logada, o perfil de acesso (Cidadão x Gestor Público) e o logout.
export function PerfilScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const gestor = isGestor(user);
  const inicial = (user?.name ?? '?').trim().charAt(0).toUpperCase();

  return (
    <GradientBackground variant="screen" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Perfil" testID="perfil-header" />
      <View className="gap-4 px-4 pt-2">
        <View className="items-center gap-2 rounded-card bg-white p-6 shadow-md">
          <View className="mb-1 h-20 w-20 items-center justify-center rounded-full border-4 border-infoSoft bg-navy">
            <Text className="font-inter-extrabold text-3xl text-white">{inicial}</Text>
          </View>
          <Text className="font-inter-extrabold text-xl text-text" testID="perfil-nome">
            {user?.name}
          </Text>
          <Text className="font-inter-medium text-sm text-textMuted">{user?.email}</Text>
          <View
            className={`mt-1 rounded-full px-3.5 py-1.5 ${gestor ? 'bg-infoSoft' : 'bg-successSoft'}`}
            testID="perfil-role"
          >
            <Text className={`font-inter-bold text-[13px] ${gestor ? 'text-navy' : 'text-successStrong'}`}>
              {perfilLabel(user?.role)}
            </Text>
          </View>
          {user?.createdAt ? (
            <Text className="font-inter-medium text-[13px] text-textSubtle">Conta criada em {formatarData(user.createdAt)}</Text>
          ) : null}
        </View>

        <View className="gap-3 rounded-card bg-white p-5 shadow-md">
          <Text className="font-inter-bold text-xs uppercase text-primary">Com este perfil você pode</Text>
          {PERMISSOES[gestor ? 'gestor' : 'cidadao'].map((item) => (
            <View key={item.text} className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-infoSoft">
                <Icon name={item.icon} size={18} color={colors.primary} />
              </View>
              <Text className="flex-1 font-inter-medium text-sm text-textMuted">{item.text}</Text>
            </View>
          ))}
        </View>

        <Button label="Sair da conta" variant="surface" onPress={() => logout()} testID="perfil-logout" />
      </View>
    </GradientBackground>
  );
}

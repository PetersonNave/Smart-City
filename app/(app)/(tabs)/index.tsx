import { useAuth } from '../../../src/auth/AuthContext';
import { isGestor } from '../../../src/domain/demanda';
import { PainelGestorScreen } from '../../../src/screens/gestor/PainelGestorScreen';
import { HomeScreen } from '../../../src/screens/home/HomeScreen';

// Início por perfil: o Gestor Público vê o painel de indicadores; o cidadão, a Home.
// (As métricas também são protegidas no backend: cidadão recebe 403.)
export default function InicioScreen() {
  const { user } = useAuth();
  return isGestor(user) ? <PainelGestorScreen /> : <HomeScreen />;
}

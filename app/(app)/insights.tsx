import { Redirect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { isGestor } from '../../src/domain/demanda';
import { routes } from '../../src/navigation/routes';
import { InsightsCidadeScreen } from '../../src/screens/gestor/InsightsCidadeScreen';

// Só o gestor vê os insights (o backend também responde 403 ao cidadão).
export default function InsightsRoute() {
  const { user } = useAuth();
  return isGestor(user) ? <InsightsCidadeScreen /> : <Redirect href={routes.inicio} />;
}

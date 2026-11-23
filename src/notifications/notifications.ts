import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { registrarPushToken } from '../api/notificacoes';
import { STATUS_META } from '../domain/demanda';
import type { Demanda, DemandaStatus } from '../types';

// Fluxo "registrar → acompanhar → notificar":
// - Push remoto (principal): o app envia o Expo push token ao backend; quando o gestor muda
//   o status, o backend avisa o autor pela Expo Push API (funciona com o app fechado).
// - Notificação local (alternativa): sem push remoto (Expo Go no Android desde o SDK 53,
//   simulador, build sem projectId), o app avisa quando percebe a mudança ao recarregar.

export const DEMANDAS_CHANNEL_ID = 'demandas';

/** Conteúdo `data` das notificações de status (o mesmo enviado pelo backend). */
export type DemandaNotificationData = {
  tipo: 'status_demanda';
  demandaId: number;
  status: DemandaStatus;
};

let handlerConfigured = false;

/** Mostra a notificação mesmo com o app aberto (sem handler, o SO a descarta em primeiro plano). */
export function configureNotificationHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Se o canal "demandas" foi criado. No Expo Go para Android a criação pode ser rejeitada pelo
// código nativo (NullPointerException, defeito D-14): o app segue com o canal padrão.
let demandasChannelReady = false;

/** Android 8+: notificações precisam de um canal. Retorna se o canal "demandas" existe. */
async function ensureAndroidChannel(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    await Notifications.setNotificationChannelAsync(DEMANDAS_CHANNEL_ID, {
      name: 'Andamento das demandas',
      description: 'Avisos quando o status de uma demanda sua muda.',
      importance: Notifications.AndroidImportance.HIGH,
    });
    demandasChannelReady = true;
  } catch (error) {
    // Não pode derrubar o resto: sem o canal próprio, a permissão e o aviso continuam
    // funcionando pelo canal padrão do aparelho.
    demandasChannelReady = false;
    console.warn('[notificações] canal "demandas" indisponível, usando o canal padrão:', error);
  }
  return demandasChannelReady;
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return requested.granted;
}

function easProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
}

export type PushRegistration = { mode: 'remote'; token: string } | { mode: 'local'; reason: string };

/**
 * Pede permissão e tenta registrar o push remoto no backend. Se não der, o app segue com
 * notificações locais (o motivo volta para log/diagnóstico).
 */
export async function registerForDemandNotifications(): Promise<PushRegistration | null> {
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const projectId = easProjectId();
  if (!projectId) return { mode: 'local', reason: 'Projeto EAS não configurado (extra.eas.projectId).' };

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registrarPushToken(token);
    return { mode: 'remote', token };
  } catch (error) {
    return { mode: 'local', reason: error instanceof Error ? error.message : String(error) };
  }
}

/** Notificação local equivalente à que o backend envia na mudança de status. */
export async function notifyStatusChangeLocally(demanda: Demanda) {
  const data: DemandaNotificationData = { tipo: 'status_demanda', demandaId: demanda.id, status: demanda.status };
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Sua demanda foi atualizada',
      body: `"${demanda.title}" agora está: ${STATUS_META[demanda.status].label}.`,
      data,
      sound: 'default',
    },
    // Sem o canal "demandas" (ver ensureAndroidChannel), o Android usa o canal padrão.
    trigger: Platform.OS === 'android' && demandasChannelReady ? { channelId: DEMANDAS_CHANNEL_ID } : null,
  });
}

/** Lê o id da demanda de uma notificação de status (remota ou local). */
export function demandaIdFromNotification(notification: Notifications.Notification): number | null {
  const data = notification.request.content.data as Partial<DemandaNotificationData> | undefined;
  if (data?.tipo !== 'status_demanda') return null;
  const id = Number(data.demandaId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

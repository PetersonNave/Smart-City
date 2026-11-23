import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { isGestor } from '../domain/demanda';
import { routes } from '../navigation/routes';
import { setStatusChangeListener, useDemandStore } from '../stores/demandStore';
import {
  configureNotificationHandler,
  demandaIdFromNotification,
  notifyStatusChangeLocally,
  registerForDemandNotifications,
  type PushRegistration,
} from './notifications';

/**
 * Liga as notificações à sessão logada:
 * - registra o aparelho no backend (push remoto) ou ativa o aviso local como alternativa;
 * - notificação recebida com o app aberto → atualiza a demanda no store;
 * - toque na notificação (inclusive abrindo o app fechado) → abre o detalhe da demanda.
 */
export function useDemandNotifications(): PushRegistration | null {
  const { user } = useAuth();
  const router = useRouter();
  const [registration, setRegistration] = useState<PushRegistration | null>(null);
  const handledResponseId = useRef<string | null>(null);
  const lastResponse = Notifications.useLastNotificationResponse();
  const userId = user?.id;
  const gestor = isGestor(user);

  useEffect(() => {
    configureNotificationHandler();
    if (!userId) return;
    let active = true;
    registerForDemandNotifications()
      .then((result) => {
        if (active) setRegistration(result);
      })
      .catch((error) => {
        // Sem permissão/serviço o app funciona normalmente, só sem avisos. O erro fica no log
        // (antes era engolido em silêncio, o que escondeu o defeito D-14).
        console.warn('[notificações] registro falhou:', error);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  // Alternativa local: só para o cidadão (o gestor é quem muda os status) e só quando o
  // push remoto não está ativo, para o mesmo aviso não chegar duas vezes.
  useEffect(() => {
    if (gestor || registration?.mode !== 'local') return;
    setStatusChangeListener((demanda) => {
      notifyStatusChangeLocally(demanda).catch((error) => {
        console.warn('[notificações] aviso local falhou:', error);
      });
    });
    return () => setStatusChangeListener(null);
  }, [gestor, registration?.mode]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const id = demandaIdFromNotification(notification);
      // O aviso já foi exibido: só sincroniza a demanda (sem gerar outro aviso local).
      if (id) useDemandStore.getState().fetchOne(id, { notify: false }).catch(() => {});
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!lastResponse || lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const responseId = lastResponse.notification.request.identifier;
    if (handledResponseId.current === responseId) return;
    handledResponseId.current = responseId;
    const id = demandaIdFromNotification(lastResponse.notification);
    if (id) router.push(routes.demanda(id));
  }, [lastResponse, router]);

  return registration;
}

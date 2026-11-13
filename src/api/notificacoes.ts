import { apiClient } from './client';
import { unwrap, type ApiEnvelope } from './envelope';

/** Registra o Expo push token deste aparelho para a conta logada (`PUT /auth/push-token`). */
export async function registrarPushToken(token: string): Promise<void> {
  await unwrap(apiClient.put<ApiEnvelope<null>>('/auth/push-token', { token }));
}

/** Para de enviar notificações para este aparelho (`DELETE /auth/push-token`). */
export async function removerPushToken(): Promise<void> {
  await unwrap(apiClient.delete<ApiEnvelope<null>>('/auth/push-token'));
}

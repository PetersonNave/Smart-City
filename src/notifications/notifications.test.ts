import * as Notifications from 'expo-notifications';
import { registrarPushToken } from '../api/notificacoes';
import {
  demandaIdFromNotification,
  notifyStatusChangeLocally,
  registerForDemandNotifications,
} from './notifications';

jest.mock('../api/notificacoes');

const mockConstants: { expoConfig: { extra: Record<string, unknown> }; easConfig: undefined } = {
  expoConfig: { extra: {} },
  easConfig: undefined,
};
jest.mock('expo-constants', () => ({
  __esModule: true,
  get default() {
    return mockConstants;
  },
}));

function setProjectId(projectId: string | undefined) {
  mockConstants.expoConfig.extra = projectId ? { eas: { projectId } } : {};
}

describe('notifications', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns null when the user denies the permission', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: false, canAskAgain: true });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: false });

    await expect(registerForDemandNotifications()).resolves.toBeNull();
    expect(registrarPushToken).not.toHaveBeenCalled();
  });

  it('registers the Expo push token in the backend', async () => {
    setProjectId('project-123');
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: true });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({ data: 'ExponentPushToken[abc]' });

    await expect(registerForDemandNotifications()).resolves.toEqual({ mode: 'remote', token: 'ExponentPushToken[abc]' });
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-123' });
    expect(registrarPushToken).toHaveBeenCalledWith('ExponentPushToken[abc]');
  });

  it('falls back to local notifications when remote push is unavailable', async () => {
    setProjectId('project-123');
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: true });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValueOnce(new Error('Expo Go'));

    await expect(registerForDemandNotifications()).resolves.toEqual({ mode: 'local', reason: 'Expo Go' });
  });

  it('falls back to local notifications without an EAS project id', async () => {
    setProjectId(undefined);
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: true });

    const result = await registerForDemandNotifications();
    expect(result?.mode).toBe('local');
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('schedules a local notification with the new status and the demand id', async () => {
    await notifyStatusChangeLocally({
      id: 42,
      title: 'Buraco na avenida',
      status: 'RESOLVED',
    } as never);

    const request = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(request.content.body).toBe('"Buraco na avenida" agora está: Concluída.');
    expect(request.content.data).toEqual({ tipo: 'status_demanda', demandaId: 42, status: 'RESOLVED' });
  });

  it('reads the demand id only from status notifications', () => {
    const build = (data: unknown) => ({ request: { content: { data } } }) as unknown as Notifications.Notification;
    expect(demandaIdFromNotification(build({ tipo: 'status_demanda', demandaId: 7, status: 'IN_PROGRESS' }))).toBe(7);
    expect(demandaIdFromNotification(build({ tipo: 'outro', demandaId: 7 }))).toBeNull();
    expect(demandaIdFromNotification(build({ tipo: 'status_demanda', demandaId: 'x' }))).toBeNull();
  });
});

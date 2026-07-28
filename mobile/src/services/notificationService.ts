import * as Notifications from 'expo-notifications';
import apiClient from './apiClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    // expo-permissions is deprecated — use Notifications.requestPermissionsAsync()
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async getDeviceToken(): Promise<string | null> {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch {
      return null;
    }
  },

  async registerDevice(): Promise<void> {
    const allowed = await notificationService.requestPermissions();
    if (!allowed) return;

    const deviceToken = await notificationService.getDeviceToken();
    if (deviceToken) {
      await apiClient.post('/notificacoes/registrar-device', {
        device_token: deviceToken,
        platform: 'mobile',
      });
    }
  },

  setupListeners(): () => void {
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notificação recebida:', notification.request.content.title);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Usuário tocou notificação:', data);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  },
};

// Mock expo-notifications before importing
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
}));

// Mock apiClient
jest.mock('../src/services/apiClient', () => ({
  post: jest.fn(),
}));

import * as Notifications from 'expo-notifications';
import apiClient from '../src/services/apiClient';
import { notificationService } from '../src/services/notificationService';

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockApi = apiClient as jest.Mocked<typeof apiClient>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('notificationService.requestPermissions()', () => {
  it('returns true when permission is granted', async () => {
    mockNotifications.requestPermissionsAsync.mockResolvedValueOnce({
      status: 'granted' as any,
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });

    const result = await notificationService.requestPermissions();
    expect(result).toBe(true);
    expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('returns false when permission is denied', async () => {
    mockNotifications.requestPermissionsAsync.mockResolvedValueOnce({
      status: 'denied' as any,
      granted: false,
      canAskAgain: false,
      expires: 'never',
    });

    const result = await notificationService.requestPermissions();
    expect(result).toBe(false);
  });
});

describe('notificationService.getDeviceToken()', () => {
  it('returns push token string', async () => {
    mockNotifications.getExpoPushTokenAsync.mockResolvedValueOnce({
      data: 'ExponentPushToken[test-device-token]',
      type: 'expo',
    });

    const token = await notificationService.getDeviceToken();
    expect(token).toBe('ExponentPushToken[test-device-token]');
  });

  it('returns null on error', async () => {
    mockNotifications.getExpoPushTokenAsync.mockRejectedValueOnce(new Error('No token'));

    const token = await notificationService.getDeviceToken();
    expect(token).toBeNull();
  });
});

describe('notificationService.registerDevice()', () => {
  it('does not call API when permissions denied', async () => {
    mockNotifications.requestPermissionsAsync.mockResolvedValueOnce({
      status: 'denied' as any,
      granted: false,
      canAskAgain: false,
      expires: 'never',
    });

    await notificationService.registerDevice();
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('registers device with token when permissions granted', async () => {
    mockNotifications.requestPermissionsAsync.mockResolvedValueOnce({
      status: 'granted' as any,
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });
    mockNotifications.getExpoPushTokenAsync.mockResolvedValueOnce({
      data: 'ExponentPushToken[abc]',
      type: 'expo',
    });
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: {} });

    await notificationService.registerDevice();

    expect(mockApi.post).toHaveBeenCalledWith('/notificacoes/registrar-device', {
      device_token: 'ExponentPushToken[abc]',
      platform: 'mobile',
    });
  });
});

describe('notificationService.setupListeners()', () => {
  it('returns a cleanup function', () => {
    const sub = { remove: jest.fn() };
    mockNotifications.addNotificationReceivedListener.mockReturnValueOnce(sub as any);
    mockNotifications.addNotificationResponseReceivedListener.mockReturnValueOnce(sub as any);

    const cleanup = notificationService.setupListeners();

    expect(typeof cleanup).toBe('function');
    expect(mockNotifications.addNotificationReceivedListener).toHaveBeenCalledTimes(1);
    expect(mockNotifications.addNotificationResponseReceivedListener).toHaveBeenCalledTimes(1);
  });

  it('cleanup removes both subscriptions', () => {
    const sub1 = { remove: jest.fn() };
    const sub2 = { remove: jest.fn() };
    mockNotifications.addNotificationReceivedListener.mockReturnValueOnce(sub1 as any);
    mockNotifications.addNotificationResponseReceivedListener.mockReturnValueOnce(sub2 as any);

    const cleanup = notificationService.setupListeners();
    cleanup();

    expect(mockNotifications.removeNotificationSubscription).toHaveBeenCalledWith(sub1);
    expect(mockNotifications.removeNotificationSubscription).toHaveBeenCalledWith(sub2);
  });
});

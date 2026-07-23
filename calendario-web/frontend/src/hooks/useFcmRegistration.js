import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { api } from '../services/api.js';
import { useAuth } from './useAuth.js';

// Registra o token FCM do app Android nativo (Capacitor) para receber push
// mesmo com o app totalmente fechado — o Web Push (usePushSubscription) não
// é confiável nesse cenário dentro da WebView. Não faz nada no navegador.
export function useFcmRegistration() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !Capacitor.isNativePlatform()) return;

    let registrationListener;
    let actionListener;
    let cancelled = false;

    async function register() {
      const status = await PushNotifications.checkPermissions();
      let granted = status.receive === 'granted';
      if (!granted) {
        const requested = await PushNotifications.requestPermissions();
        granted = requested.receive === 'granted';
      }
      if (!granted || cancelled) return;

      registrationListener = await PushNotifications.addListener('registration', (token) => {
        api.registerDeviceToken(token.value).catch((err) => console.error('Falha ao registrar token FCM:', err.message));
      });

      actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const link = action.notification?.data?.link;
        if (link) navigate(link);
      });

      await PushNotifications.register();
    }

    register().catch((err) => console.error('Falha ao configurar notificações push nativas:', err.message));

    return () => {
      cancelled = true;
      registrationListener?.remove();
      actionListener?.remove();
    };
  }, [isAuthenticated, navigate]);
}

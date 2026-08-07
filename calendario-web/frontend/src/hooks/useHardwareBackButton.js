import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

// Botão/gesto físico de voltar do Android só existe no app nativo — no
// navegador (dev, PWA) o listener nem é registrado.
export function useHardwareBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle;
    let cancelled = false;

    CapacitorApp.addListener('backButton', () => {
      if (location.pathname.startsWith('/app/')) {
        navigate('/app');
      } else {
        CapacitorApp.exitApp();
      }
    })
      .then((h) => {
        if (cancelled) h.remove();
        else handle = h;
      })
      .catch((err) => console.error('Falha ao registrar o botão de voltar:', err.message));

    return () => {
      cancelled = true;
      handle?.remove();
    };
  }, [location.pathname, navigate]);
}

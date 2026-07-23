import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { Button } from '../../components/ui/index.js';

export function FcmTestButton() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!Capacitor.isNativePlatform()) return null;

  async function handleTestPush() {
    setLoading(true);
    try {
      const result = await api.testPush();
      showToast(result.message, result.sent ? 'success' : 'error');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card settings-form" style={{ marginTop: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>Testar notificação nativa</h3>
      <p>Envia uma notificação de teste para este celular, para conferir se o push está chegando.</p>
      <Button type="button" variant="secondary" loading={loading} onClick={handleTestPush}>
        Enviar notificação de teste
      </Button>
    </div>
  );
}

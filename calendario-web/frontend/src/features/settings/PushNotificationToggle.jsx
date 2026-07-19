import { usePushSubscription } from '../../hooks/usePushSubscription.js';
import { useToast } from '../../hooks/useToast.js';
import { Button } from '../../components/ui/index.js';

export function PushNotificationToggle() {
  const { supported, subscribed, loading, subscribe, unsubscribe } = usePushSubscription();
  const { showToast } = useToast();

  if (!supported) return null;

  async function handleToggle() {
    try {
      if (subscribed) {
        await unsubscribe();
        showToast('Notificações push desativadas neste dispositivo', 'success');
      } else {
        await subscribe();
        showToast('Notificações push ativadas neste dispositivo', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="card settings-form" style={{ marginTop: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>Notificações push</h3>
      <p>
        Recebe os lembretes de evento neste dispositivo quando o WhatsApp estiver desconectado.
      </p>
      <Button type="button" variant={subscribed ? 'secondary' : 'primary'} loading={loading} onClick={handleToggle}>
        {subscribed ? 'Desativar notificações push' : 'Ativar notificações push'}
      </Button>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { Icon } from '../../components/ui/index.js';

const POLL_INTERVAL_MS = 5000;

export function WhatsappConnectionCard() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const result = await api.getWhatsappStatus();
        if (!cancelled) setStatus(result);
      } catch {
        // silencioso — a próxima tentativa do polling tenta de novo
      }
    }

    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="card settings-form" style={{ marginTop: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>Conexão com WhatsApp</h3>

      {!status && <p>Verificando status da conexão...</p>}

      {status?.connected && (
        <p className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Icon name="check-circle" />
          WhatsApp conectado — lembretes por WhatsApp estão funcionando.
        </p>
      )}

      {status && !status.connected && status.qr && (
        <>
          <p>
            A sessão do WhatsApp caiu. Abra o WhatsApp no celular que envia os lembretes,
            vá em <strong>Aparelhos conectados → Conectar um aparelho</strong> e escaneie o
            código abaixo.
          </p>
          <img
            src={status.qr}
            alt="QR code para conectar o WhatsApp"
            style={{ width: 240, height: 240, borderRadius: 'var(--radius-md)' }}
          />
        </>
      )}

      {status && !status.connected && !status.qr && <p>Gerando QR code, aguarde...</p>}
    </div>
  );
}

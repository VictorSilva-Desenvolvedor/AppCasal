import { useEffect, useState } from 'react';
import { Button, Field } from '../../components/ui/index.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useToast } from '../../hooks/useToast.js';

function CheckboxField({ id, label, checked, onChange }) {
  return (
    <div className="field">
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400 }} htmlFor={id}>
        <input type="checkbox" id={id} style={{ width: 'auto' }} checked={checked} onChange={onChange} />
        {label}
      </label>
    </div>
  );
}

export function PreferencesForm() {
  const {
    notificationChannel,
    remindersMuted,
    notifyOnInvite,
    hidePastEventsByDefault,
    financeDefaultScope,
    activityLogLimit,
    updatePreferences,
  } = useTheme();
  const { showToast } = useToast();

  const [channel, setChannel] = useState(notificationChannel);
  const [muted, setMuted] = useState(remindersMuted);
  const [notifyInvite, setNotifyInvite] = useState(notifyOnInvite);
  const [hidePast, setHidePast] = useState(hidePastEventsByDefault);
  const [financeScope, setFinanceScope] = useState(financeDefaultScope);
  const [logLimit, setLogLimit] = useState(activityLogLimit);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setChannel(notificationChannel), [notificationChannel]);
  useEffect(() => setMuted(remindersMuted), [remindersMuted]);
  useEffect(() => setNotifyInvite(notifyOnInvite), [notifyOnInvite]);
  useEffect(() => setHidePast(hidePastEventsByDefault), [hidePastEventsByDefault]);
  useEffect(() => setFinanceScope(financeDefaultScope), [financeDefaultScope]);
  useEffect(() => setLogLimit(activityLogLimit), [activityLogLimit]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updatePreferences({
        notificationChannel: channel,
        remindersMuted: muted,
        notifyOnInvite: notifyInvite,
        hidePastEventsByDefault: hidePast,
        financeDefaultScope: financeScope,
        activityLogLimit: Number(logLimit),
      });
      showToast('Preferências salvas', 'success');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card settings-form" style={{ marginTop: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>Preferências do sistema</h3>
      <form onSubmit={handleSubmit}>
        <Field label="Canal de notificação preferido" htmlFor="pref-notification-channel">
          <select
            id="pref-notification-channel"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
          >
            <option value="both">WhatsApp e Push</option>
            <option value="whatsapp">Somente WhatsApp</option>
            <option value="push">Somente Push</option>
          </select>
        </Field>

        <CheckboxField
          id="pref-reminders-muted"
          label="Silenciar lembretes de evento"
          checked={muted}
          onChange={(event) => setMuted(event.target.checked)}
        />

        <CheckboxField
          id="pref-notify-invite"
          label="Notificar quando eu for convidado para um evento"
          checked={notifyInvite}
          onChange={(event) => setNotifyInvite(event.target.checked)}
        />

        <CheckboxField
          id="pref-hide-past-default"
          label="Ocultar eventos passados por padrão em novos eventos"
          checked={hidePast}
          onChange={(event) => setHidePast(event.target.checked)}
        />

        <Field label="Visualização padrão do Financeiro" htmlFor="pref-finance-scope">
          <select
            id="pref-finance-scope"
            value={financeScope}
            onChange={(event) => setFinanceScope(event.target.value)}
          >
            <option value="self">Meu</option>
            <option value="partner">Outra pessoa</option>
          </select>
        </Field>

        <Field label="Itens exibidos no log de atividades" htmlFor="pref-activity-log-limit">
          <select
            id="pref-activity-log-limit"
            value={logLimit}
            onChange={(event) => setLogLimit(event.target.value)}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </Field>

        <p className="error-text">{error}</p>
        <Button type="submit" loading={saving}>
          Salvar preferências
        </Button>
      </form>
    </div>
  );
}

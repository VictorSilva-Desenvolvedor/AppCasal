import { useEffect, useState } from 'react';
import { Button, Field } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';

export function ProfileForm() {
  const { updateCurrentUser } = useAuth();
  const { showToast } = useToast();
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getMyProfile()
      .then((profile) => {
        if (!cancelled) setWhatsapp(profile.whatsappNumber || '');
      })
      .catch((err) => console.error('Não foi possível carregar o perfil:', err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updated = await api.updateProfile({ whatsappNumber: whatsapp.trim() });
      updateCurrentUser(updated);
      showToast('Perfil salvo', 'success');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h2 style={{ marginTop: '2rem' }}>Meu perfil</h2>
      <p>Seu número de WhatsApp é usado para receber lembretes de eventos (5, 3 e 1 dia antes).</p>
      <form className="card settings-form" onSubmit={handleSubmit}>
        <Field label="WhatsApp (DDD + número, ex: 62998035936)" htmlFor="profile-whatsapp">
          <input
            type="text"
            id="profile-whatsapp"
            placeholder="62998035936"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
          />
        </Field>
        <p className="error-text">{error}</p>
        <Button type="submit" loading={saving}>
          Salvar perfil
        </Button>
      </form>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Button, Field } from '../../components/ui/index.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useToast } from '../../hooks/useToast.js';
import { ColorThemeSwatches } from './ColorThemeSwatches.jsx';
import { ProfileForm } from './ProfileForm.jsx';
import { PushNotificationToggle } from './PushNotificationToggle.jsx';

export function SettingsPage() {
  const { theme, background, saveThemeAndBackground } = useTheme();
  const { showToast } = useToast();

  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [backgroundInput, setBackgroundInput] = useState(background);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setSelectedTheme(theme), [theme]);
  useEffect(() => setBackgroundInput(background), [background]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await saveThemeAndBackground(selectedTheme, backgroundInput.trim());
      showToast('Configurações salvas', 'success');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="view">
      <h2>Configurações</h2>
      <p>Tema e plano de fundo são compartilhados entre todos os usuários do calendário.</p>

      <form className="card settings-form" onSubmit={handleSubmit}>
        <Field label="Tema" htmlFor="settings-theme">
          <select
            id="settings-theme"
            value={selectedTheme}
            onChange={(event) => setSelectedTheme(event.target.value)}
          >
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </Field>

        <div className="field">
          <label>Cor de destaque</label>
          <ColorThemeSwatches />
        </div>

        <Field label="Plano de fundo (URL de imagem, opcional)" htmlFor="settings-background">
          <input
            type="text"
            id="settings-background"
            placeholder="https://..."
            value={backgroundInput}
            onChange={(event) => setBackgroundInput(event.target.value)}
          />
        </Field>

        <p className="error-text">{error}</p>
        <Button type="submit" loading={saving}>
          Salvar configurações
        </Button>
      </form>

      <ProfileForm />
      <PushNotificationToggle />
    </section>
  );
}

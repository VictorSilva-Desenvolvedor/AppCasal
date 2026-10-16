import { useState } from 'react';
import { Button, Field, Modal } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';

// Vínculo do casal: quem já tem conta gera um código de 6 caracteres e manda
// para o par; quem recebeu digita aqui (ou no cadastro) e entra no mesmo espaço,
// levando o que já tinha lançado sozinho.
export function CouplePairing({ open, onClose }) {
  const { joinCouple } = useAuth();
  const { showToast } = useToast();
  const [code, setCode] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [typed, setTyped] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const data = await api.createCoupleCode();
      setCode(data.code);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleShare() {
    const text = `Entra no nosso AppCasal: no cadastro (ou no lobby, em "Tenho um código"), use o código ${code}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AppCasal', text });
        return;
      }
      await navigator.clipboard.writeText(code);
      showToast('Código copiado', 'success');
    } catch {
      // Compartilhamento cancelado pela pessoa: nada a fazer.
    }
  }

  async function handleJoin(event) {
    event.preventDefault();
    setJoining(true);
    setError('');
    try {
      await joinCouple(typed);
      showToast('Pronto! Agora vocês estão no mesmo espaço.', 'success');
      // Todos os dados (eventos, finanças, hábitos) mudaram de espaço: recarrega
      // o app inteiro em vez de tentar atualizar cada contexto.
      window.location.assign('/app');
    } catch (err) {
      setError(err.message);
      setJoining(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Juntar o casal">
      <section className="couple-section">
        <h3>Convide seu par</h3>
        <p>Gere um código e mande para a pessoa. Vale por 7 dias.</p>
        {code ? (
          <div className="couple-code-box">
            <strong className="couple-code" aria-label={`Código ${code.split('').join(' ')}`}>
              {code}
            </strong>
            <Button variant="secondary" onClick={handleShare}>
              {typeof navigator !== 'undefined' && navigator.share ? 'Compartilhar' : 'Copiar código'}
            </Button>
          </div>
        ) : (
          <Button onClick={handleGenerate} loading={generating}>
            Gerar código
          </Button>
        )}
      </section>

      <form className="couple-section" onSubmit={handleJoin}>
        <h3>Tenho um código</h3>
        <p>Seu par já tem conta? Digite o código para entrar no espaço de vocês. O que você já lançou vem junto.</p>
        <Field label="Código do casal" htmlFor="couple-code-input">
          <input
            id="couple-code-input"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={8}
            placeholder="Ex: K7P2QX"
            value={typed}
            onChange={(e) => setTyped(e.target.value.toUpperCase())}
          />
        </Field>
        <Button type="submit" variant="secondary" loading={joining} disabled={typed.trim().length < 6}>
          Entrar no espaço do casal
        </Button>
      </form>

      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}

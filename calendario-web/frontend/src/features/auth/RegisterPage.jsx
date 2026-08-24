import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Field, Icon } from '../../components/ui/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { AuthHeroPanel } from './AuthHeroPanel.jsx';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await register({ name: name.trim(), password });
      navigate('/app', { replace: true });
    } catch (err) {
      showToast(err.message, 'error');
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <AuthHeroPanel tagline="Crie sua conta e comece a organizar a vida a dois." />

        <div className="auth-form-side">
          <Card className="auth-card fade-in">
            <h2>Criar conta</h2>
            <p>Cadastre-se para acessar o calendário do casal</p>

            <form onSubmit={handleSubmit}>
              <Field label="Nome" htmlFor="name">
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  autoFocus
                  autoComplete="username"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field label="Senha (mínimo de 4 caracteres)" htmlFor="password">
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    required
                    minLength={4}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} />
                  </button>
                </div>
              </Field>
              <Button type="submit" block loading={loading}>
                Cadastrar
              </Button>
            </form>

            <p className="auth-footer">
              Já tem conta? <Link to="/login">Entrar</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

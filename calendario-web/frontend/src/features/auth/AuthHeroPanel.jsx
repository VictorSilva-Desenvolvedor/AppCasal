import { useEffect, useRef } from 'react';
import { Icon } from '../../components/ui/index.js';

export function AuthHeroPanel({ tagline }) {
  const heroRef = useRef(null);
  const hoopRef = useRef(null);

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    // cataas.com sorteia um gatinho real a cada chamada; o timestamp evita cache do navegador.
    const photoUrl = `https://cataas.com/cat?width=1600&height=2000&_=${Date.now()}`;
    const preload = new Image();
    preload.onload = () => {
      heroEl.style.backgroundImage = `url('${photoUrl}')`;
      // No celular o mesmo gatinho aparece dentro do bastidor do cabeçalho.
      if (hoopRef.current) {
        hoopRef.current.style.backgroundImage = `url('${photoUrl}')`;
        hoopRef.current.classList.add('has-photo');
      }
    };
    preload.src = photoUrl;
  }, []);

  return (
    <>
      {/* Abaixo de md o painel da foto não cabe — a marca vira um cabeçalho compacto
          acima do formulário, para a tela não ficar sem identidade nem sem h1. */}
      <div className="auth-brand-compact">
        <div className="auth-hoop" aria-hidden="true">
          <div className="auth-hoop-photo" ref={hoopRef}>
            <Icon name="heart" />
          </div>
        </div>
        <h1>AppCasal</h1>
        {tagline && <p>{tagline}</p>}
      </div>

      <aside className="auth-hero" ref={heroRef}>
        <div className="auth-hero-content">
          <div className="auth-hero-logo">
            <Icon name="heart" />
          </div>
          <h1>AppCasal</h1>
          {tagline && <p>{tagline}</p>}
        </div>
      </aside>
    </>
  );
}

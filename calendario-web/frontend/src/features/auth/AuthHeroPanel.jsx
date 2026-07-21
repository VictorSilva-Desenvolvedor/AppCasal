import { useEffect, useRef } from 'react';
import { Icon } from '../../components/ui/index.js';

export function AuthHeroPanel({ tagline }) {
  const heroRef = useRef(null);

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    // cataas.com sorteia um gatinho real a cada chamada; o timestamp evita cache do navegador.
    const photoUrl = `https://cataas.com/cat?width=1600&height=2000&_=${Date.now()}`;
    const preload = new Image();
    preload.onload = () => {
      heroEl.style.backgroundImage = `url('${photoUrl}')`;
    };
    preload.src = photoUrl;
  }, []);

  return (
    <aside className="auth-hero" ref={heroRef}>
      <div className="auth-hero-content">
        <div className="auth-hero-logo">
          <Icon name="heart" />
        </div>
        <h1>AppCasal</h1>
        {tagline && <p>{tagline}</p>}
      </div>
    </aside>
  );
}

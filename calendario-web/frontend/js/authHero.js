export function loadAuthHeroPhoto() {
  const heroEl = document.getElementById('auth-hero');
  if (!heroEl) return;

  // cataas.com sorteia um gatinho real a cada chamada; o timestamp evita cache do navegador.
  const photoUrl = `https://cataas.com/cat?width=1600&height=2000&_=${Date.now()}`;
  const preload = new Image();
  preload.onload = () => {
    heroEl.style.backgroundImage = `url('${photoUrl}')`;
  };
  preload.src = photoUrl;
}

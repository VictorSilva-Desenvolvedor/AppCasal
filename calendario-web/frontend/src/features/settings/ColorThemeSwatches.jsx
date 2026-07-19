import { useTheme } from '../../hooks/useTheme.js';
import { useToast } from '../../hooks/useToast.js';

const SWATCHES = [
  { value: 'indigo', label: 'Índigo' },
  { value: 'rose', label: 'Rosa' },
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
  { value: 'orange', label: 'Laranja' },
  { value: 'red', label: 'Vermelho' },
  { value: 'teal', label: 'Turquesa' },
  { value: 'amber', label: 'Âmbar' },
  { value: 'miku', label: 'Hatsune Miku' },
  { value: 'black-green', label: 'Preto & Verde' },
];

export function ColorThemeSwatches() {
  const { colorTheme, setColorTheme } = useTheme();
  const { showToast } = useToast();

  async function handleSelect(value) {
    try {
      await setColorTheme(value);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="color-swatch-grid">
      {SWATCHES.map((swatch) => (
        <button
          key={swatch.value}
          type="button"
          className={`color-swatch swatch-${swatch.value}${colorTheme === swatch.value ? ' is-active' : ''}`}
          title={swatch.label}
          onClick={() => handleSelect(swatch.value)}
        />
      ))}
    </div>
  );
}

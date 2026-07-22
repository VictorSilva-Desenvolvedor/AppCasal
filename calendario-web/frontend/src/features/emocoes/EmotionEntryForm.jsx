import { useState } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { EmotionCategoryPicker } from './EmotionCategoryPicker.jsx';
import { EmotionIntensitySlider } from './EmotionIntensitySlider.jsx';

export function EmotionEntryForm({ day, period, onSaved }) {
  const [panel, setPanel] = useState('categoria');
  const [emotion, setEmotion] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  function handleSelectEmotion(key) {
    setEmotion(key);
    setError('');
    setPanel('intensidade');
  }

  async function handleCommitIntensity(intensity) {
    setError('');
    setSaving(true);
    try {
      await api.createEmotionEntry({ day, period, emotion, intensity, note: note.trim() });
      await onSaved();
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
      setSaving(false);
    }
  }

  return (
    <div className="emotion-entry-form">
      <div className={`emotion-slide-track emotion-slide-track--${panel}`}>
        <div className="emotion-slide-panel">
          <EmotionCategoryPicker selectedEmotion={emotion} onSelect={handleSelectEmotion} />
        </div>
        <div className="emotion-slide-panel">
          <EmotionIntensitySlider
            emotion={emotion}
            note={note}
            onNoteChange={setNote}
            onBack={() => setPanel('categoria')}
            onCommit={handleCommitIntensity}
            saving={saving}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}

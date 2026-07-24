import { useState } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { EMOTIONS } from '../../constants/emotions.js';
import { EmotionCategoryPicker } from './EmotionCategoryPicker.jsx';
import { EmotionIntensitySlider } from './EmotionIntensitySlider.jsx';
import { EmotionReasonPicker } from './EmotionReasonPicker.jsx';

export function EmotionEntryForm({ day, period, onSaved }) {
  const [panel, setPanel] = useState('categoria');
  const [emotion, setEmotion] = useState('');
  const [intensity, setIntensity] = useState(null);
  const [note, setNote] = useState('');
  const [reasons, setReasons] = useState([]);
  const [reasonOther, setReasonOther] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  function handleSelectEmotion(key) {
    setEmotion(key);
    setError('');
    setPanel('intensidade');
  }

  function handleIntensityChosen(value) {
    setIntensity(value);
    setError('');
    setPanel('motivo');
  }

  function handleToggleReason(key) {
    setReasons((prev) => (prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]));
  }

  async function submitEntry(useReasons) {
    setError('');
    setSaving(true);
    try {
      await api.createEmotionEntry({
        day,
        period,
        emotion,
        intensity,
        note: note.trim(),
        reasons: useReasons ? reasons : [],
        reasonOther: useReasons && reasons.includes('outro') ? reasonOther.trim() : '',
      });
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
            onIntensityChosen={handleIntensityChosen}
            saving={saving}
            error={error}
          />
        </div>
        <div className="emotion-slide-panel">
          <EmotionReasonPicker
            selectedReasons={reasons}
            otherText={reasonOther}
            onToggleReason={handleToggleReason}
            onOtherTextChange={setReasonOther}
            emotionColor={EMOTIONS[emotion]?.color}
            onBack={() => setPanel('intensidade')}
            onSkip={() => submitEntry(false)}
            onSave={() => submitEntry(true)}
            saving={saving}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}

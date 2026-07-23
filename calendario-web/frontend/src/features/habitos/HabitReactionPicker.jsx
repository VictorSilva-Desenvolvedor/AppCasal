import { useState } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';

const REACTION_EMOJIS = ['❤️', '👏', '🔥', '😂', '💪'];

export function HabitReactionPicker({ checkin, currentUserId, onReacted }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const myReaction = checkin.reactions?.find((r) => (r.user?._id ?? r.user) === currentUserId);

  async function handlePick(emoji) {
    setSaving(true);
    try {
      if (myReaction?.emoji === emoji) {
        await api.removeHabitCheckinReaction(checkin._id);
      } else {
        await api.setHabitCheckinReaction(checkin._id, emoji);
      }
      setOpen(false);
      onReacted();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="habit-reaction-picker">
      {checkin.reactions?.length > 0 && (
        <span className="habit-reaction-summary">{checkin.reactions.map((r) => r.emoji).join(' ')}</span>
      )}
      <button
        type="button"
        className={`habit-reaction-trigger${myReaction ? ' is-active' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        disabled={saving}
        aria-label="Reagir ao check-in"
      >
        {myReaction ? myReaction.emoji : '+'}
      </button>
      {open && (
        <div className="habit-reaction-options">
          {REACTION_EMOJIS.map((emoji) => (
            <button key={emoji} type="button" onClick={() => handlePick(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

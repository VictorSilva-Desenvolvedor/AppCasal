import { useState } from 'react';
import {
  EMOTIONS,
  EMOTION_CATEGORY_ACCENT,
  EMOTION_CATEGORY_LABELS,
  EMOTION_CATEGORY_ORDER,
} from '../../constants/emotions.js';

export function EmotionCategoryPicker({ selectedEmotion, onSelect }) {
  const [activeCategory, setActiveCategory] = useState(EMOTION_CATEGORY_ORDER[0]);

  const emotionsInCategory = Object.entries(EMOTIONS).filter(([, meta]) => meta.category === activeCategory);

  return (
    <div className="emotion-category-picker">
      <div className="emotion-category-tabs">
        {EMOTION_CATEGORY_ORDER.map((category) => (
          <button
            key={category}
            type="button"
            className={`emotion-category-tab${activeCategory === category ? ' is-active' : ''}`}
            style={{ '--tab-accent': EMOTION_CATEGORY_ACCENT[category] }}
            onClick={() => setActiveCategory(category)}
          >
            {EMOTION_CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      <div className="emotion-category-grid">
        {emotionsInCategory.map(([key, meta]) => (
          <button
            key={key}
            type="button"
            className={`emotion-category-btn${selectedEmotion === key ? ' is-selected' : ''}`}
            style={{ '--chip-color': meta.color }}
            onClick={() => onSelect(key)}
          >
            <span className="emotion-category-circle">
              <span aria-hidden="true">{meta.emoji}</span>
            </span>
            <span className="emotion-category-label">{meta.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

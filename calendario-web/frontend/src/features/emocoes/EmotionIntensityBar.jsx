const INTENSITY_SEGMENTS = [1, 2, 3, 4, 5];

export function EmotionIntensityBar({ intensity, color }) {
  return (
    <div className="emotion-intensity-bar">
      {INTENSITY_SEGMENTS.map((segment) => (
        <span
          key={segment}
          className="emotion-intensity-bar-segment"
          style={segment <= intensity ? { background: color } : undefined}
        />
      ))}
    </div>
  );
}

import { Icon } from './Icon.jsx';

const TOAST_ICONS = { success: 'check-circle', error: 'alert-circle' };

export function Toast({ message, type = 'success', leaving = false, onLeaveEnd }) {
  return (
    <div
      className={`toast toast-${type}${leaving ? ' is-leaving' : ''}`}
      onAnimationEnd={() => {
        if (leaving) onLeaveEnd?.();
      }}
    >
      <Icon name={TOAST_ICONS[type] || TOAST_ICONS.success} />
      <span>{message}</span>
    </div>
  );
}

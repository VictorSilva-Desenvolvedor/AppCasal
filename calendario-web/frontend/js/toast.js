let container = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

const TOAST_ICONS = { success: 'check-circle', error: 'alert-circle' };

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconName = TOAST_ICONS[type] || TOAST_ICONS.success;
  toast.innerHTML = `
    <svg class="icon" aria-hidden="true"><use href="../assets/icons.svg#icon-${iconName}"></use></svg>
    <span>${escapeHtml(message)}</span>
  `;
  ensureContainer().appendChild(toast);

  setTimeout(() => {
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3000);
}

export function setButtonLoading(button, loading) {
  if (!button) return;
  button.classList.toggle('is-loading', loading);
  button.disabled = loading;
}

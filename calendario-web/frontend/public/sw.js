// Service worker do Nosso Calendário.
// Por enquanto só cuida de notificações push (lembretes quando o WhatsApp
// está desconectado) — cache offline do app shell entra numa fase futura.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Nosso Calendário', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Nosso Calendário', {
      body: payload.body || '',
      icon: '/icon-aniversario.png',
      badge: '/icon-aniversario.png',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});

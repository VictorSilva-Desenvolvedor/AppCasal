const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes = require('./routes/userRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const updateRequestRoutes = require('./routes/updateRequestRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const pushRoutes = require('./routes/pushRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const financeCategoryRoutes = require('./routes/financeCategoryRoutes');
const financeEntryRoutes = require('./routes/financeEntryRoutes');
const reimbursementRoutes = require('./routes/reimbursementRoutes');
const financeGoalRoutes = require('./routes/financeGoalRoutes');
const financeSimulationRoutes = require('./routes/financeSimulationRoutes');
const financeMonthRoutes = require('./routes/financeMonthRoutes');
const financeImportRoutes = require('./routes/financeImportRoutes');
const emotionEntryRoutes = require('./routes/emotionEntryRoutes');
const habitRoutes = require('./routes/habitRoutes');
const habitCheckinRoutes = require('./routes/habitCheckinRoutes');
const watchlistItemRoutes = require('./routes/watchlistItemRoutes');
const watchlistRatingRoutes = require('./routes/watchlistRatingRoutes');
const candyEntryRoutes = require('./routes/candyEntryRoutes');
const taskItemRoutes = require('./routes/taskItemRoutes');
const weeklySummaryRoutes = require('./routes/weeklySummaryRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const vehicleMaintenanceRoutes = require('./routes/vehicleMaintenanceRoutes');
const vehiclePaymentRoutes = require('./routes/vehiclePaymentRoutes');
const { isWhatsappReady } = require('./services/whatsappService');
const { isFcmReady } = require('./services/fcmService');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/update-requests', updateRequestRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/finance-categories', financeCategoryRoutes);
app.use('/api/finance-entries', financeEntryRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/finance-goals', financeGoalRoutes);
app.use('/api/finance-simulations', financeSimulationRoutes);
app.use('/api/finance-months', financeMonthRoutes);
app.use('/api/finance-import', financeImportRoutes);
app.use('/api/emotion-entries', emotionEntryRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/habit-checkins', habitCheckinRoutes);
app.use('/api/watchlist-items', watchlistItemRoutes);
app.use('/api/watchlist-ratings', watchlistRatingRoutes);
app.use('/api/candy-entries', candyEntryRoutes);
app.use('/api/task-items', taskItemRoutes);
app.use('/api/weekly-summary', weeklySummaryRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicle-maintenances', vehicleMaintenanceRoutes);
app.use('/api/vehicle-payments', vehiclePaymentRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, whatsapp: isWhatsappReady(), fcm: isFcmReady() }));

const frontendDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDir));

// Fallback de SPA: qualquer rota GET que não seja /api/* e não bata em um
// arquivo estático cai no index.html, para o React Router assumir o
// client-side routing (inclusive em refresh direto de /app/calendario etc.).
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Registro duplicado' });
  }

  res.status(err.status || 500).json({ message: err.message || 'Erro interno do servidor' });
});

module.exports = app;

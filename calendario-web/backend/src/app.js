const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
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
const { isFcmReady } = require('./services/fcmService');

const app = express();

app.use(cors());
app.use(express.json());

// Conecta (ou reaproveita a conexão já aberta) antes de cada requisição —
// necessário em ambiente serverless, onde não há um bootstrap único que
// roda antes do processo aceitar requisições.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

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

app.get('/api/health', (req, res) => res.json({ ok: true, fcm: isFcmReady() }));

app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Registro duplicado' });
  }

  // Erros de conexão/autenticação com o MongoDB (ex.: credencial do Atlas
  // rotacionada, IP não liberado no Network Access) vazam a mensagem crua do
  // driver (ex.: "bad auth : Authentication failed.") — isso não deve chegar
  // ao usuário disfarçado de erro de login.
  if (
    err.name === 'MongoServerError' ||
    err.name === 'MongooseServerSelectionError' ||
    err.message?.includes('MONGO_URI')
  ) {
    return res.status(503).json({ message: 'Não foi possível conectar ao servidor. Tente novamente em instantes.' });
  }

  res.status(err.status || 500).json({ message: err.message || 'Erro interno do servidor' });
});

module.exports = app;

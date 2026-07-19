require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
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
const { startWhatsapp, isWhatsappReady } = require('./services/whatsappService');
const { checkAndSendReminders } = require('./services/reminderService');

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

app.get('/api/health', (req, res) => res.json({ ok: true, whatsapp: isWhatsappReady() }));

const frontendDir = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendDir));
app.get('/', (req, res) => res.redirect('/pages/login.html'));

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

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));

    startWhatsapp().catch((err) => console.error('Falha ao iniciar WhatsApp:', err.message));

    cron.schedule(
      '0 8 * * *',
      () => {
        checkAndSendReminders().catch((err) => console.error('Falha ao verificar lembretes:', err.message));
      },
      { timezone: 'America/Sao_Paulo' }
    );
  })
  .catch((err) => {
    console.error('Falha ao conectar no MongoDB:', err.message);
    process.exit(1);
  });

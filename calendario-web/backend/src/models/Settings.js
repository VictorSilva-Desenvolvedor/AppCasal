const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    colorTheme: {
      type: String,
      enum: ['indigo', 'rose', 'blue', 'green', 'orange', 'red', 'teal', 'amber', 'miku', 'black-green'],
      default: 'indigo',
    },
    background: { type: String, default: '' },
    sidebarCollapsed: { type: Boolean, default: false },
    notificationChannel: { type: String, enum: ['whatsapp', 'push', 'both'], default: 'both' },
    remindersMuted: { type: Boolean, default: false },
    notifyOnInvite: { type: Boolean, default: true },
    hidePastEventsByDefault: { type: Boolean, default: false },
    financeDefaultScope: { type: String, enum: ['self', 'partner'], default: 'self' },
    activityLogLimit: { type: Number, enum: [50, 100, 200, 500], default: 200 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);

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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);

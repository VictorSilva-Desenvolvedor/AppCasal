const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    colorTheme: {
      type: String,
      enum: ['indigo', 'rose', 'blue', 'green', 'orange', 'red', 'teal', 'amber', 'miku', 'black-green'],
      default: 'indigo',
    },
    background: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);

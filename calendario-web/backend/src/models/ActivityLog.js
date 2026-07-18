const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['created', 'updated', 'deleted'], required: true },
    eventTitle: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
    details: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);

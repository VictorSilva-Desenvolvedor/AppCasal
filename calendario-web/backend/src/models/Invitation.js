const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  },
  { timestamps: true }
);

invitationSchema.index(
  { event: 1, invitee: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'accepted'] } } }
);

module.exports = mongoose.model('Invitation', invitationSchema);

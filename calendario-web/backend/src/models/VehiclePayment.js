const mongoose = require('mongoose');

const vehiclePaymentSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    description: { type: String, required: true, trim: true, maxlength: 100 },
    category: {
      type: String,
      enum: ['financiamento', 'ipva', 'seguro', 'outros'],
      default: 'outros',
    },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['pendente', 'pago'], default: 'pendente' },
    paidAt: { type: Date, default: null },

    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

vehiclePaymentSchema.index({ vehicle: 1, status: 1 });

module.exports = mongoose.model('VehiclePayment', vehiclePaymentSchema);

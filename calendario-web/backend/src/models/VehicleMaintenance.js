const mongoose = require('mongoose');

const vehicleMaintenanceSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    category: {
      type: String,
      enum: ['oleo', 'revisao', 'pneus', 'freios', 'outros'],
      default: 'outros',
    },
    status: { type: String, enum: ['pendente', 'concluido'], default: 'pendente' },

    // Vencimento por data e/ou km — ambos opcionais, usados juntos pra achar
    // qual bate primeiro (ver vehicleUtils.js#maintenanceUrgency no frontend).
    dueDate: { type: Date, default: null },
    dueOdometer: { type: Number, default: null, min: 0 },

    completedAt: { type: Date, default: null },
    completedOdometer: { type: Number, default: null, min: 0 },

    cost: { type: Number, default: null, min: 0 },
    notes: { type: String, default: '', trim: true, maxlength: 500 },

    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

vehicleMaintenanceSchema.index({ vehicle: 1, status: 1 });

module.exports = mongoose.model('VehicleMaintenance', vehicleMaintenanceSchema);

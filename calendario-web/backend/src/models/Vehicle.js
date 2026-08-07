const mongoose = require('mongoose');

const odometerHistoryEntrySchema = new mongoose.Schema(
  {
    value: { type: Number, required: true, min: 0 },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    brand: { type: String, default: '', trim: true, maxlength: 60 },
    model: { type: String, default: '', trim: true, maxlength: 60 },
    plate: { type: String, default: '', trim: true, maxlength: 20 },
    year: { type: Number, default: null },
    color: { type: String, default: '', trim: true, maxlength: 30 },
    photoUrl: { type: String, default: '', trim: true },

    currentOdometer: { type: Number, default: 0, min: 0 },

    // Guarda os valores anteriores do odômetro (mais recente primeiro) toda
    // vez que ele muda — permite reverter uma correção errada (ex: digitou
    // um zero a mais) sem precisar lembrar o número certo de cabeça.
    odometerHistory: { type: [odometerHistoryEntrySchema], default: [] },

    purchaseDate: { type: Date, default: null },
    notes: { type: String, default: '', trim: true, maxlength: 500 },

    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: String, default: 'principal' },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

vehicleSchema.index({ team: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);

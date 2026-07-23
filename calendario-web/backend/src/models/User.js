const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    photo: { type: String, default: '' },
    whatsappNumber: { type: String, default: '', trim: true },
    includeInHabits: { type: Boolean, default: true },
    // Isola dados entre o casal principal e a equipe de teste — não tem
    // relação com includeInHabits (que só controla pareamento de hábitos).
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

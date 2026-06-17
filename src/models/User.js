import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Veuillez fournir un nom'],
    },
    email: {
      type: String,
      required: [true, 'Veuillez fournir un email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Veuillez fournir un mot de passe'],
      select: false,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'EMPLOYE'],
      default: 'EMPLOYE',
    },
    actif: {
      type: Boolean,
      default: true,
    },
    approuve: {
      type: Boolean,
      default: false,
    },
    matricule: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple nulls for Admins
    },
    departement: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);

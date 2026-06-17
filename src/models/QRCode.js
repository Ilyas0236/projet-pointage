import mongoose from 'mongoose';

const QRCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    dateGeneration: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dateExpiration: {
      type: Date,
      required: true,
    },
    actif: {
      type: Boolean,
      default: true,
    },
    cree_par: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.QRCode || mongoose.model('QRCode', QRCodeSchema);

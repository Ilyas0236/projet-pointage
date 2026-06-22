import mongoose from 'mongoose';

const PointageSchema = new mongoose.Schema(
  {
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; }, // normalized date
    },
    heure: {
      type: String, // e.g., "08:32"
      required: true,
    },
    type: {
      type: String,
      enum: ['ENTREE', 'SORTIE'],
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    valide: {
      type: Boolean,
      default: true,
    },
    qrcode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRCode',
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ZoneAutorisee',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure we don't have exact duplicate records
PointageSchema.index({ employe: 1, date: 1, type: 1 }, { unique: false });

export default mongoose.models.Pointage || mongoose.model('Pointage', PointageSchema);

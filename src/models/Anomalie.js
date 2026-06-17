import mongoose from 'mongoose';

const AnomalieSchema = new mongoose.Schema(
  {
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; },
    },
    type: {
      type: String,
      enum: ['RETARD', 'ABSENCE', 'SORTIE_ANTICIPEE', 'INSUFFISANCE_HEURES'],
      required: true,
    },
    description: {
      type: String,
    },
    heuresTravaillees: {
      type: Number,
      default: 0,
    },
    seuilAttendu: {
      type: Number,
      default: 8, // hours
    },
    resolu: {
      type: Boolean,
      default: false,
    },
    commentaireAdmin: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to avoid duplicate anomalies of same type on same day for user
AnomalieSchema.index({ employe: 1, date: 1, type: 1 }, { unique: true });

export default mongoose.models.Anomalie || mongoose.model('Anomalie', AnomalieSchema);

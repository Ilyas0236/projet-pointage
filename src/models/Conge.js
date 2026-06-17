import mongoose from 'mongoose';

const CongeSchema = new mongoose.Schema(
  {
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date_debut: {
      type: Date,
      required: true,
    },
    date_fin: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['ANNUEL', 'MALADIE', 'EXCEPTIONNEL'],
      required: true,
    },
    statut: {
      type: String,
      enum: ['EN_ATTENTE', 'VALIDE', 'REFUSE', 'ANNULE'],
      default: 'EN_ATTENTE',
    },
    motif: {
      type: String,
    },
    date_traitement: {
      type: Date,
    },
    traite_par: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Conge || mongoose.model('Conge', CongeSchema);

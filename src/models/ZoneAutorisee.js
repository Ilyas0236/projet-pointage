import mongoose from 'mongoose';

const ZoneAutoriseeSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    latitudeCentre: {
      type: Number,
      required: true,
    },
    longitudeCentre: {
      type: Number,
      required: true,
    },
    rayonMetres: {
      type: Number,
      required: true,
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ZoneAutorisee || mongoose.model('ZoneAutorisee', ZoneAutoriseeSchema);

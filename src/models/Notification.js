import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // If null, it means it's sent to ADMIN(s)
      required: false,
    },
    titre: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['INFO', 'ALERTE', 'CONGE', 'AVERTISSEMENT'],
      default: 'INFO',
    },
    lu: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

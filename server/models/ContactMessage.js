import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    },
    subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export default mongoose.model('ContactMessage', contactMessageSchema);

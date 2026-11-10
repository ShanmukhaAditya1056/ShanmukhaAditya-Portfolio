import mongoose from 'mongoose';

// Limits mirror server/utils/contactSchema.js; values arrive already sanitised.
const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    },
    subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    emailVerified: { type: Boolean, default: false },
    ip: { type: String, maxlength: 64 },
    userAgent: { type: String, maxlength: 200 },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export default mongoose.model('ContactMessage', contactMessageSchema);

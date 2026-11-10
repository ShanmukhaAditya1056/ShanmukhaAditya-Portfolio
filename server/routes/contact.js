import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import ContactMessage from '../models/ContactMessage.js';
import validateContact from '../utils/validateContact.js';

const router = Router();

// 5 submissions per IP every 15 minutes.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent. Please try again in a few minutes.' },
});

router.post('/', contactLimiter, async (req, res, next) => {
  try {
    // Honeypot: real users never fill the hidden "website" field.
    if (typeof req.body?.website === 'string' && req.body.website.trim() !== '') {
      return res.status(201).json({ success: true, message: 'Message received.' });
    }

    const { data, errors } = validateContact(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'The message service is temporarily unavailable. Please email me directly.',
      });
    }

    const saved = await ContactMessage.create(data);
    return res.status(201).json({ success: true, message: 'Message received.', id: saved._id });
  } catch (err) {
    return next(err);
  }
});

export default router;

import mongoose, { Schema } from 'mongoose';

const messageSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  chatId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 2000,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// Compound index for cursor pagination: sort by chatId, then createdAt descending, then id descending
messageSchema.index({ chatId: 1, createdAt: -1, id: -1 });

export const MessageModel = mongoose.model('Message', messageSchema);
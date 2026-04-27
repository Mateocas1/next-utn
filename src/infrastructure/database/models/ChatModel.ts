import mongoose, { Schema } from 'mongoose';

const chatSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  participants: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'Participants array cannot be empty',
    },
    index: true,
  },
  latestMessagePreview: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  timestamps: false, // We handle createdAt/updatedAt manually for control
});

// Index for cursor pagination: sort by updatedAt descending, then id descending
chatSchema.index({ updatedAt: -1, id: -1 });

export const ChatModel = mongoose.model('Chat', chatSchema);
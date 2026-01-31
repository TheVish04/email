import mongoose from 'mongoose';

const reviewItemSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    resolved: { type: Boolean, default: false },
    correctedDepartment: { type: String, default: null },
    correctedPriority: { type: String, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const ReviewItem = mongoose.model('ReviewItem', reviewItemSchema);

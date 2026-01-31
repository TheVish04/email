import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    body: { type: String, default: '' },
    sender: { type: String, default: '' },
    department: { type: String, required: true },
    priority: { type: String, required: true, enum: ['P0', 'P1', 'P2', 'P3'] },
    intensity: { type: String, required: true, enum: ['critical', 'high', 'medium', 'low'] },
    sentiment: { type: String, default: 'neutral', enum: ['negative', 'neutral', 'positive'] },
    confidenceDepartment: { type: Number, default: 0 },
    confidencePriority: { type: Number, default: 0 },
    explanationDepartment: { type: String, default: '' },
    explanationPriority: { type: String, default: '' },
    suggestedSlaHours: { type: Number, default: 24 },
    seen: { type: Boolean, default: false },
    status: { type: String, default: 'open', enum: ['open', 'closed'] },
    source: { type: String, default: 'external', enum: ['external', 'internal'] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    messageId: { type: String, default: null },
  },
  { timestamps: true }
);

ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ messageId: 1 }, { sparse: true });
ticketSchema.index({ seen: 1, status: 1 });
ticketSchema.index({ intensity: 1, sentiment: 1, department: 1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);

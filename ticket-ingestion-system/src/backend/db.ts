import mongoose from 'mongoose';

// Connect to MongoDB
export const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('Please add your Mongo URI to .env file');
    }
    try {
        await mongoose.connect(uri);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// Ticket Schema
const TicketSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    sender: { type: String, required: true },
    body: { type: String, required: true },
    attachments: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    normalizedText: { type: String, default: '' },
    language: { type: String, default: 'unknown' },
    department: { type: String, default: 'General' },
    departmentConfidence: { type: Number, default: 0 },
    departmentReason: { type: String, default: '' },
    sentiment: { type: String, default: 'neutral' },
    urgency: { type: String, default: 'medium' },
    tags: { type: [String], default: [] },
    urgencyReason: { type: String, default: '' },
    impactScore: { type: Number, default: 0 },
    impactLevel: { type: String, default: 'low' },
    impactReason: { type: String, default: '' },
    status: { type: String, default: 'open' }, // open, in-progress, closed
    viewed: { type: Boolean, default: false },
    normalized: { type: mongoose.Schema.Types.Mixed }, // Flexible field
}, {
    timestamps: true // Adds createdAt and updatedAt
});

export const Ticket = mongoose.model('Ticket', TicketSchema);

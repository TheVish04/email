export interface Ticket {
    _id: string;
    subject: string;
    sender: string;
    body: string;
    createdAt: string;
    normalizedText?: string;
    language?: string;
    department?: string;
    departmentConfidence?: number;
    departmentReason?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    urgencyReason?: string;
    impactScore?: number;
    impactLevel?: 'low' | 'medium' | 'high' | 'critical';
    impactReason?: string;
    status?: string;
    viewed?: boolean;
}

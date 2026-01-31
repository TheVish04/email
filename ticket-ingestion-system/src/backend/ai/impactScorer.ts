interface TicketData {
    urgency: 'low' | 'medium' | 'high' | 'critical';
    sentiment: 'positive' | 'neutral' | 'negative';
    department: string;
    normalizedText: string;
    sender: string;
}

export interface ImpactResult {
    impactScore: number;
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    impactReason: string;
}

export const calculateImpact = (ticket: TicketData): ImpactResult => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Urgency Weight (Max 40)
    switch (ticket.urgency) {
        case 'critical': score += 40; reasons.push('Critical urgency'); break;
        case 'high': score += 30; reasons.push('High urgency'); break;
        case 'medium': score += 15; break;
        case 'low': score += 5; break;
    }

    // 2. Sentiment Weight (Max 20)
    if (ticket.sentiment === 'negative') {
        score += 20;
        reasons.push('Negative sentiment');
    } else if (ticket.sentiment === 'neutral') {
        score += 5;
    }

    // 3. Department Weight (Max 10)
    const criticalDepts = ['IT', 'Finance', 'Security', 'Legal'];
    if (criticalDepts.includes(ticket.department)) {
        score += 10;
        reasons.push(`Critical department (${ticket.department})`);
    }

    // 4. Keyword Weight (Max 20)
    const keywords = ['outage', 'downtime', 'data breach', 'ceo', 'urgent', 'legal', 'lawsuit', 'emergency', 'hacked', 'security'];
    const foundKeywords = keywords.filter(k => ticket.normalizedText.includes(k));
    if (foundKeywords.length > 0) {
        score += 20; // Flat bonus for any critical keyword
        reasons.push(`Critical keywords found`);
    }

    // 5. Sender Weight (Max 10)
    // Check for internal or VIP domains (mock logic)
    if (ticket.sender.endsWith('@company.com')) {
        score += 10;
        reasons.push('Internal sender');
    }

    // Cap score at 100
    score = Math.min(score, 100);

    // Determine Level
    let level: ImpactResult['impactLevel'] = 'low';
    if (score > 75) level = 'critical';
    else if (score > 50) level = 'high';
    else if (score > 25) level = 'medium';

    return {
        impactScore: score,
        impactLevel: level,
        impactReason: reasons.join(', ') || 'Standard ticket processing',
    };
};

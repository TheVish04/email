import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

// Use the working model
const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
});

export interface AnalysisResult {
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    reason: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeTicket = async (text: string, retries = 3): Promise<AnalysisResult> => {
    if (!apiKey) {
        return { sentiment: 'neutral', urgency: 'medium', tags: [], reason: 'AI disabled' };
    }

    const prompt = `
    Analyze the following support ticket text.
    
    1. Determine the Sentiment: "positive", "neutral", or "negative".
    2. Determine Urgency Level: "low", "medium", "high", or "critical".
    3. Generate Tags: A list of 1-3 short topic tags (e.g., "billing", "server", "bug", "feature-request").
    4. Provide a Reason: A brief explanation for the urgency level.

    Text: "${text}"

    Return a valid JSON object with this structure:
    {
      "sentiment": "neutral",
      "urgency": "medium",
      "tags": ["tag1", "tag2"],
      "reason": "explanation"
    }

    Do not include markdown formatting. Return raw JSON.
  `;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            const response = result.response;
            let textResponse = response.text();

            textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const json = JSON.parse(textResponse);

            // Validate/Normalize fields
            const sentiment = ['positive', 'neutral', 'negative'].includes(json.sentiment) ? json.sentiment : 'neutral';
            const urgency = ['low', 'medium', 'high', 'critical'].includes(json.urgency) ? json.urgency : 'medium';
            const tags = Array.isArray(json.tags) ? json.tags.map((t: any) => String(t).toLowerCase()) : [];

            return {
                sentiment,
                urgency,
                tags,
                reason: json.reason || 'No reason provided'
            };

        } catch (error: any) {
            if (error.status === 429 || error.status === 503 || error.message?.includes('429')) {
                const delay = (attempt + 1) * 2000;
                await sleep(delay);
                continue;
            }
            break;
        }
    }

    // Fallback
    return fallbackAnalysis(text);
};

const fallbackAnalysis = (text: string): AnalysisResult => {
    const lower = text.toLowerCase();
    let urgency: AnalysisResult['urgency'] = 'medium';
    let sentiment: AnalysisResult['sentiment'] = 'neutral';
    let tags: string[] = [];

    if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('crash') || lower.includes('down')) {
        urgency = 'high';
        tags.push('critical-issue');
    }

    if (lower.includes('thanks') || lower.includes('great') || lower.includes('love')) {
        sentiment = 'positive';
    } else if (lower.includes('angry') || lower.includes('frustrated') || lower.includes('bad') || lower.includes('worse')) {
        sentiment = 'negative';
    }

    return { sentiment, urgency, tags, reason: 'AI analysis failed, using keywords.' };
};

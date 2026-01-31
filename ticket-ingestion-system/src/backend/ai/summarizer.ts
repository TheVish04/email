import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ticket } from '../db';
import { retryOperation, getGenerativeModel } from './classifier'; // Reusing retry logic

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const summarizeUnseenTickets = async () => {
    try {
        // Fetch last 10 unseen tickets to summarize
        const recentTickets = await Ticket.find({ viewed: false }).sort({ createdAt: -1 }).limit(10);

        if (recentTickets.length === 0) {
            return "No new unseen tickets to summarize.";
        }

        const ticketTexts = recentTickets.map(t => `- [${t.department}] ${t.subject}: ${t.body.substring(0, 100)}...`).join('\n');

        const model = getGenerativeModel(genAI);

        const prompt = `
        You are an AI assistant for a corporate support dashboard.
        Summarize the following recent tickets into a single cohesive paragraph (50-60 words).
        Focus on the main issues and any critical trends.
        Do not use bullet points. Write it as a briefing for an executive.

        Tickets:
        ${ticketTexts}
        `;

        const result = await retryOperation(() => model.generateContent(prompt));
        return result.response.text();
    } catch (error) {
        console.error("Summary generation failed:", error);
        return "Unable to generate AI summary at this time.";
    }
};

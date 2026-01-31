import { Ticket } from './db';
import { cleanText } from './preprocessing/textCleaner';
import { detectLanguage } from './preprocessing/languageDetector';
import { classifyTicket } from './ai/classifier';
import { analyzeTicket } from './ai/sentimentAndTags';
import { calculateImpact } from './ai/impactScorer';
import { summarizeUnseenTickets } from './ai/summarizer';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export const apiHandler = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    try {
        if (url.pathname === '/api/ai/summary') {
            if (req.method === 'GET') {
                const summary = await summarizeUnseenTickets();
                return Response.json({ summary }, { headers: CORS_HEADERS });
            }
        }

        if (url.pathname === '/api/kpi/monthly') {
            if (req.method === 'GET') {
                const monthParam = url.searchParams.get('month');
                const now = new Date();

                let startOfMonth: Date;
                let endOfMonth: Date;

                if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
                    const [year, month] = monthParam.split('-').map(Number);
                    startOfMonth = new Date(year, month - 1, 1);
                    endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
                } else {
                    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    endOfMonth = new Date();
                }

                const monthFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };

                const totalTickets = await Ticket.countDocuments(monthFilter);
                const unseenTickets = await Ticket.countDocuments({ ...monthFilter, viewed: false });
                const openTickets = await Ticket.countDocuments({ ...monthFilter, status: { $ne: 'closed' } });

                return Response.json({
                    totalTickets,
                    unseenTickets,
                    openTickets
                }, { headers: CORS_HEADERS });
            }
        }

        if (url.pathname === '/api/tickets') {
            if (req.method === 'GET') {
                const tickets = await Ticket.find().sort({ impactScore: -1, createdAt: -1 });
                return Response.json(tickets, { headers: CORS_HEADERS });
            }

            if (req.method === 'POST') {
                const body = await req.json();
                // Validation
                if (!body.subject || !body.sender || !body.body) {
                    return Response.json(
                        { error: 'Missing required fields: subject, sender, body' },
                        { status: 400, headers: CORS_HEADERS }
                    );
                }

                // Preprocessing
                const fullText = `${body.subject} ${body.body}`;
                const normalizedText = cleanText(fullText);
                const language = detectLanguage(normalizedText);

                // AI Analysis (Parallel Execution)
                const [classification, analysis] = await Promise.all([
                    classifyTicket(normalizedText),
                    analyzeTicket(normalizedText)
                ]);

                // Phase 5: Business Impact Score
                const impact = calculateImpact({
                    urgency: analysis.urgency,
                    sentiment: analysis.sentiment,
                    department: classification.department,
                    normalizedText,
                    sender: body.sender,
                });

                const ticket = await Ticket.create({
                    subject: body.subject,
                    sender: body.sender,
                    body: body.body,
                    attachments: body.attachments || [],
                    normalizedText,
                    language,

                    // Classification
                    department: classification.department,
                    departmentConfidence: classification.confidence,
                    departmentReason: classification.reason,

                    // Sentiment & Tags
                    sentiment: analysis.sentiment,
                    urgency: analysis.urgency,
                    tags: analysis.tags,
                    urgencyReason: analysis.reason,

                    // Impact
                    impactScore: impact.impactScore,
                    impactLevel: impact.impactLevel,
                    impactReason: impact.impactReason,
                });

                return Response.json(ticket, { status: 201, headers: CORS_HEADERS });
            }
        }
    } catch (error) {
        console.error(error);
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500, headers: CORS_HEADERS }
        );
    }

    return Response.json({ error: 'Endpoint not found' }, { status: 404, headers: CORS_HEADERS });
};

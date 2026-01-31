import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

const CLASSIFY_PROMPT = `You are an email/ticket classifier for an enterprise. Classify the following email and respond with ONLY a valid JSON object (no markdown, no extra text).

Departments: IT, HR, Finance, Customer Support, Legal, Admin.
Priorities: P0 (critical - outage, security), P1 (high - blocked user), P2 (medium), P3 (low).
Sentiment: negative, neutral, or positive.

Respond with exactly this structure:
{
  "department": "IT",
  "priority": "P1",
  "confidenceDepartment": 0.9,
  "confidencePriority": 0.85,
  "explanationDepartment": "Key phrases: server down, cannot login",
  "explanationPriority": "Key phrases: all users affected, urgent",
  "sentiment": "negative"
}

Email subject: {{subject}}
Email body: {{body}}`;

const SUMMARY_PROMPT = `Summarize the following support emails in 50-60 words. Write one short paragraph only. Do not use bullet points.

Emails:
{{bodies}}`;

function parseJsonFromText(text) {
  const stripped = text.replace(/```json?\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Invalid JSON from Gemini');
  }
}

const PRIORITY_TO_INTENSITY = { P0: 'critical', P1: 'high', P2: 'medium', P3: 'low' };
const PRIORITY_TO_SLA = { P0: 1, P1: 4, P2: 24, P3: 72 };

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(model, prompt, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response?.text?.() || '';
    } catch (err) {
      lastErr = err;
      const is429 = err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('rate');
      const delay = is429 ? 50000 : 2000;
      if (attempt < maxRetries && is429) {
        console.log('[Gemini] Rate limit hit, retrying in', delay / 1000, 's...');
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

export async function classifyEmail(subject, body) {
  if (!genAI) throw new Error('GEMINI_API_KEY not set');
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const prompt = CLASSIFY_PROMPT.replace('{{subject}}', subject).replace('{{body}}', body || '(no body)');
  const text = await generateWithRetry(model, prompt);
  const data = parseJsonFromText(text);
  const department = data.department || 'IT';
  const priority = data.priority || 'P2';
  const intensity = PRIORITY_TO_INTENSITY[priority] || 'medium';
  const suggestedSlaHours = PRIORITY_TO_SLA[priority] ?? 24;
  return {
    department,
    priority,
    intensity,
    sentiment: data.sentiment || 'neutral',
    confidenceDepartment: Math.min(1, Math.max(0, Number(data.confidenceDepartment) || 0.8)),
    confidencePriority: Math.min(1, Math.max(0, Number(data.confidencePriority) || 0.8)),
    explanationDepartment: data.explanationDepartment || '',
    explanationPriority: data.explanationPriority || '',
    suggestedSlaHours,
  };
}

export async function summarizeEmails(texts) {
  if (!genAI) return 'Summary unavailable (no API key).';
  if (!texts || texts.length === 0) return 'No unseen emails to summarize.';
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const combined = texts.slice(0, 20).map((t, i) => `[${i + 1}] ${t.slice(0, 500)}`).join('\n\n');
  const prompt = SUMMARY_PROMPT.replace('{{bodies}}', combined);
  try {
    const text = await generateWithRetry(model, prompt);
    return text?.trim() || 'Summary unavailable.';
  } catch {
    return 'Summary unavailable (quota or API error).';
  }
}

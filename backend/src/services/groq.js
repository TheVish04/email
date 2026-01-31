import Groq from 'groq-sdk';
import { config } from '../config.js';

const client = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

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
Email body: {{body}}

{
  "department": "HR",
  "priority": "P3",
  "confidenceDepartment": 0.88,
  "confidencePriority": 0.75,
  "explanationDepartment": "Key phrases: leave policy, salary issue, HR related query",
  "explanationPriority": "Key phrases: individual request, non-urgent",
  "sentiment": "neutral"
}

Email subject: {{subject}}
Email body: {{body}}

{
  "department": "Support",
  "priority": "P2",
  "confidenceDepartment": 0.92,
  "confidencePriority": 0.8,
  "explanationDepartment": "Key phrases: help needed, issue faced, customer support",
  "explanationPriority": "Key phrases: user impacted, needs assistance",
  "sentiment": "negative"
}

Email subject: {{subject}}
Email body: {{body}}

`;

const SUMMARY_PROMPT = `Summarize the following support emails in 50-60 words. Write one short paragraph only. Do not use bullet points.

Emails:
{{bodies}}`;

const BULK_REPLY_PROMPT = `You are a professional customer support agent. Write a single response addressing the user(s) regarding the issue.
Issue Subject: {{subject}}
Context from user email(s):
{{bodies}}

Instructions:
1. Write a polite, empathetic, and clear response (under 100 words).
2. Do not use placeholders like "[Name]" - write it so it works for everyone (e.g., "Hello," or "Dear User,").
3. Sign off as "The Support Team".
4. OUTPUT ONLY THE EMAIL BODY. Do not include introductory text like "Here is the draft:". Start directly with the greeting.`;

function parseJsonFromText(text) {
  const stripped = text.replace(/```json?\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Invalid JSON from Groq');
  }
}

const PRIORITY_TO_INTENSITY = { P0: 'critical', P1: 'high', P2: 'medium', P3: 'low' };
const PRIORITY_TO_SLA = { P0: 1, P1: 4, P2: 24, P3: 72 };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function chatWithRetry(messages, maxRetries = 2) {
  if (!client) throw new Error('GROQ_API_KEY not set');
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        temperature: 0.2,
      });
      return completion.choices?.[0]?.message?.content || '';
    } catch (err) {
      lastErr = err;
      const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('rate');
      const delay = is429 ? 5000 : 2000;
      if (attempt < maxRetries) {
        console.log('[Groq] Rate limit or error, retrying in', delay / 1000, 's...');
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

export async function classifyEmail(subject, body) {
  const prompt = CLASSIFY_PROMPT.replace('{{subject}}', subject).replace('{{body}}', body || '(no body)');
  const text = await chatWithRetry([{ role: 'user', content: prompt }]);
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
  if (!client) return 'Summary unavailable (no Groq API key).';
  if (!texts || texts.length === 0) return 'No unseen emails to summarize.';
  const combined = texts.slice(0, 20).map((t, i) => `[${i + 1}] ${t.slice(0, 500)}`).join('\n\n');
  const prompt = SUMMARY_PROMPT.replace('{{bodies}}', combined);
  try {
    const text = await chatWithRetry([{ role: 'user', content: prompt }]);
    return text?.trim() || 'Summary unavailable.';
  } catch {
    return 'Summary unavailable (quota or API error).';
  }
}

export async function generateBroadcastDraft(subject, texts) {
  if (!client) return 'Draft unavailable (no Groq API key).';
  const combined = (texts || []).slice(0, 10).map((t, i) => `[User ${i + 1}]: ${t.slice(0, 300)}`).join('\n');
  const prompt = BULK_REPLY_PROMPT.replace('{{subject}}', subject).replace('{{bodies}}', combined);
  try {
    const text = await chatWithRetry([{ role: 'user', content: prompt }]);
    return text?.trim() || '';
  } catch (err) {
    console.error('Groq draft error:', err);
    return 'Could not generate draft.';
  }
}

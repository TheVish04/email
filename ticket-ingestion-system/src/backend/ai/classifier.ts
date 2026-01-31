import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
export const getGenerativeModel = (genAI: GoogleGenerativeAI) => {
    return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
};

// Retry wrapper
export const retryOperation = async <T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        if (retries > 0 && (error.status === 429 || error.message?.includes('429'))) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryOperation(operation, retries - 1, delay * 2);
        }
        throw error;
    }
};

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn('GEMINI_API_KEY not found in .env. AI features will be disabled.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Trying the latest flash alias found in the models list
const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
});

export interface ClassificationResult {
    department: string;
    confidence: number;
    reason: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const classifyTicket = async (text: string, retries = 3): Promise<ClassificationResult> => {
    if (!apiKey) {
        return { department: 'General', confidence: 0, reason: 'AI disabled (missing key)' };
    }

    const prompt = `
      Classify the following support ticket text into one of these departments:
      - IT (Hardware, Software, Access, Technical Issues)
      - HR (Benefits, Leave, Policy, Payroll, Hiring)
      - Finance (Invoices, Expenses, Budget, Tax)
      - Customer Support (Product usage, Refunds, Complaints)
      - General (Everything else)

      Text to classify:
      "${text}"

      Return a valid JSON object with the following structure:
      {
        "department": "Department Name",
        "confidence": 0.95,
        "reason": "Short explanation"
      }
      
      Do not include markdown formatting like \`\`\`json. Just return the raw JSON string.
    `;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            const response = result.response;
            let textResponse = response.text();

            // Clean potential markdown code blocks
            textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

            const json = JSON.parse(textResponse);

            return {
                department: json.department || 'General',
                confidence: json.confidence || 0,
                reason: json.reason || 'No reason provided',
            };
        } catch (error: any) {
            console.error(`AI Attempt ${attempt + 1} failed:`, error.message);

            if (error.status === 429 || error.status === 503 || error.message?.includes('429')) {
                const delay = (attempt + 1) * 2000;
                console.warn(`AI Rate Limit hit. Retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }

            // If it's a 404 or other fatal error, don't retry same model
            break;
        }
    }

    // Fallback if AI fails completely
    console.warn('AI Classification failed after retries. Using keyword fallback.');
    return fallbackClassification(text);
};

// Simple keyword-based fallback to ensure the UI always shows something useful
// even if the API key is over quota.
const fallbackClassification = (text: string): ClassificationResult => {
    const lower = text.toLowerCase();

    if (lower.includes('screen') || lower.includes('laptop') || lower.includes('password') || lower.includes('login') || lower.includes('wifi') || lower.includes('error')) {
        return { department: 'IT', confidence: 0.6, reason: 'Detected technical keywords (fallback)' };
    }
    if (lower.includes('salary') || lower.includes('payroll') || lower.includes('leave') || lower.includes('holiday') || lower.includes('hiring')) {
        return { department: 'HR', confidence: 0.6, reason: 'Detected HR keywords (fallback)' };
    }
    if (lower.includes('invoice') || lower.includes('tax') || lower.includes('budget') || lower.includes('expense')) {
        return { department: 'Finance', confidence: 0.6, reason: 'Detected Finance keywords (fallback)' };
    }
    if (lower.includes('refund') || lower.includes('return') || lower.includes('shipping') || lower.includes('delivery')) {
        return { department: 'Customer Support', confidence: 0.6, reason: 'Detected Support keywords (fallback)' };
    }

    return { department: 'General', confidence: 0.5, reason: 'Automatic fallback classification' };
};

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // There isn't a direct listModels method exposed easily on the main class in some versions,
        // let's try a simple generation on a very standard model name 'gemini-1.5-flash-latest' or similar 
        // to see if we can hit it.
        // Actually, the error says "Call ListModels to see...".
        // We can try to guess valid ones or check documentation.
        // Let's try 'gemini-1.5-pro' as another alternative.

        // However, for debugging purposes, let's try to just hit 'gemini-pro' again but ensure no typos.
        // The previous error was: models/gemini-pro is not found.

        // Let's try 'gemini-1.0-pro'
        console.log('Testing gemini-1.0-pro...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
        const result = await model.generateContent('Hi');
        console.log('Success with gemini-1.0-pro:', result.response.text());
    } catch (e) {
        console.error('Failed gemini-1.0-pro', e);
    }

    try {
        console.log('Testing gemini-1.5-flash-latest...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        const result = await model.generateContent('Hi');
        console.log('Success with gemini-1.5-flash-latest:', result.response.text());
    } catch (e) {
        console.error('Failed gemini-1.5-flash-latest', e);
    }
}

listModels();

/**
 * Cleans email text by removing signatures, forwarded headers,
 * and normalizing whitespace.
 */
export const cleanText = (rawText: string): string => {
    if (!rawText) return "";

    let lines = rawText.split('\n');
    let cleanLines: string[] = [];

    // Regex Patterns
    const signaturePatterns = [
        /^(?:thanks|regards|cheers|sincerely|best|yours truly)\b/i,
        /^(?:sent from my|sent via) /i,
        /^--\s*$/, // Standard signature dash
        /^_{3,}$/  // Underscore line
    ];

    const headerPatterns = [
        /^(?:from|to|sent|subject|date):\s/i,
        /^on\s.+wrote:$/i
    ];

    const quotePattern = /^>/;

    for (let line of lines) {
        line = line.trim();

        // Stop processing if we hit a likely signature start
        // This is aggressive but often correct for emails
        if (signaturePatterns.some(p => p.test(line))) {
            break;
        }

        // Skip Quotes
        if (quotePattern.test(line)) continue;

        // Skip Headers
        if (headerPatterns.some(p => p.test(line))) continue;

        cleanLines.push(line);
    }

    // Join, lowercase, and collapse spaces
    return cleanLines
        .join(' ')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Detects language based on character script usage.
 * Returns spec-compliant codes: en, hi, mixed, unknown.
 */
export type DetectedLanguage = 'en' | 'hi' | 'mixed' | 'unknown';

export const detectLanguage = (text: string): DetectedLanguage => {
    if (!text || text.trim().length === 0) return 'unknown';

    let devanagariCount = 0;
    let latinCount = 0;
    let otherCount = 0;

    // Iterate over characters
    for (const char of text) {
        const code = char.charCodeAt(0);

        // Devanagari Block: \u0900 - \u097F
        if (code >= 0x0900 && code <= 0x097F) {
            devanagariCount++;
        }
        // Latin (English) Basic + Supplement: \u0041-\u005A, \u0061-\u007A
        else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
            latinCount++;
        }
        else if (char.match(/\s/)) {
            // Ignore whitespace
        } else {
            otherCount++;
        }
    }

    const totalChars = devanagariCount + latinCount;

    if (totalChars === 0) return 'unknown';

    const hindiRatio = devanagariCount / totalChars;
    const englishRatio = latinCount / totalChars;

    // Thresholds - spec: en / hi / unknown (and mixed)
    if (hindiRatio > 0.8) return 'hi';
    if (englishRatio > 0.8) return 'en';

    // If neither dominates, it's mixed
    return 'mixed';
};

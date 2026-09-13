function formatFieldToString(val) {
    if (!val) return null;
    if (Array.isArray(val)) {
        return val.map(item => `- ${String(item).trim().replace(/^[-*•\s+]+/, '')}`).join('\n');
    }
    if (typeof val === 'object') {
        return JSON.stringify(val);
    }
    return String(val);
}

function parseAiJsonChunk(cleanedContent) {
    let parsed = { answer: "", dos: "", donts: "", confidence: 0.80 };
    try {
        parsed = JSON.parse(cleanedContent);
    } catch (e) {
        const match = cleanedContent.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                const escaped = match[0].replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m, p1) => {
                    return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
                });
                parsed = JSON.parse(escaped);
            } catch (e2) {
                const answerMatch = match[0].match(/"answer"\s*:\s*"([\s\S]*?)"/);
                const answer = answerMatch ? answerMatch[1] : "";
                
                const dosMatch = match[0].match(/"dos"\s*:\s*"([\s\S]*?)"/);
                const dos = dosMatch ? dosMatch[1] : "";
                
                const dontsMatch = match[0].match(/"donts"\s*:\s*"([\s\S]*?)"/);
                const donts = dontsMatch ? dontsMatch[1] : "";
                
                const confidenceMatch = match[0].match(/"confidence"\s*:\s*([0-9.]+)/);
                const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.80;

                if (answer) {
                    parsed = { answer, dos, donts, confidence };
                } else {
                    parsed.answer = cleanedContent;
                }
            }
        } else {
            parsed.answer = cleanedContent;
        }
    }
    return parsed;
}

module.exports = {
    formatFieldToString,
    parseAiJsonChunk
};

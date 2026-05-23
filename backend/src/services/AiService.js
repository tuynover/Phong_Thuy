const { GoogleGenerativeAI } = require('@google/generative-ai');

class AiService {
    constructor() {
        this.genAI = null;
        this.defaultModelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
        if (process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        } else {
            console.warn("GEMINI_API_KEY is not set. AI Features will not work.");
        }
    }

    getModelName(options = {}) {
        return options.model || this.defaultModelName;
    }

    cleanMarkdown(text) {
        if (!text) return '';
        let cleaned = text.trim();
        // Loại bỏ ```markdown hoặc ``` ở đầu chuỗi (không phân biệt hoa thường)
        cleaned = cleaned.replace(/^```markdown\s*/i, '');
        cleaned = cleaned.replace(/^```[a-z]*\s*/i, '');
        // Loại bỏ ``` ở cuối chuỗi
        cleaned = cleaned.replace(/\s*```$/, '');
        return cleaned.trim();
    }

    async generateInterpretation(prompt, options = {}, retries = 2) {
        if (!this.genAI) {
            throw new Error("Hệ thống chưa được cấu hình API Key của AI.");
        }

        const modelName = this.getModelName(options);
        const model = this.genAI.getGenerativeModel({ model: modelName });

        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AI Request Timeout')), 25000)
                );

                const generatePromise = model.generateContent(prompt);
                const result = await Promise.race([generatePromise, timeoutPromise]);
                const response = result.response;
                return this.cleanMarkdown(response.text());
            } catch (error) {
                console.error(`AI Generation Error (Attempt ${attempt}):`, error.message);
                
                if (attempt === retries + 1) {
                    if (error.message.includes('Timeout')) {
                        throw new Error('Hệ thống AI phản hồi chậm hoặc đang quá tải. Vui lòng thử lại sau.');
                    } else if (error.message.includes('429')) {
                        throw new Error('Hệ thống AI đang chạm giới hạn sử dụng. Vui lòng thử lại sau giây lát.');
                    } else if (error.message.includes('SAFETY')) {
                        throw new Error('Nội dung phân tích vi phạm chính sách an toàn của AI.');
                    }
                    throw new Error('Đã có lỗi xảy ra khi kết nối với máy chủ AI.');
                }
                
                await new Promise(res => setTimeout(res, 2000));
            }
        }
    }

    async generateInterpretationStream(prompt, options = {}) {
        if (!this.genAI) {
            throw new Error("Hệ thống chưa được cấu hình API Key của AI.");
        }

        const modelName = this.getModelName(options);
        const model = this.genAI.getGenerativeModel({ model: modelName });

        try {
            const resultStream = await model.generateContentStream(prompt);
            return resultStream;
        } catch (error) {
            console.error("AI Stream Generation error:", error);
            if (error.message.includes('SAFETY')) {
                throw new Error('Nội dung phân tích vi phạm chính sách an toàn của AI.');
            }
            throw new Error('Lỗi kết nối với máy chủ AI.');
        }
    }

    async countTokens(prompt, options = {}) {
        if (!this.genAI) return 0;
        try {
            const modelName = this.getModelName(options);
            const model = this.genAI.getGenerativeModel({ model: modelName });
            const countResult = await model.countTokens(prompt);
            return countResult.totalTokens || 0;
        } catch (e) {
            console.error("Error counting tokens with Gemini API, falling back to estimation:", e.message);
            // Fallback: estimate ~4 characters per token for English/Vietnamese mix
            return Math.ceil((prompt || '').length / 4);
        }
    }

    async generateStructuredOutput(prompt, schema, options = {}, retries = 2) {
        if (!this.genAI) {
            throw new Error("Hệ thống chưa được cấu hình API Key của AI.");
        }

        const modelName = this.getModelName(options);
        const model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AI Request Timeout')), 30000)
                );

                const generatePromise = model.generateContent(prompt);
                const result = await Promise.race([generatePromise, timeoutPromise]);
                const response = result.response;
                const text = response.text();
                return JSON.parse(text);
            } catch (error) {
                console.error(`AI Structured Generation Error (Attempt ${attempt}):`, error.message);
                
                if (attempt === retries + 1) {
                    if (error.message.includes('Timeout')) {
                        throw new Error('Hệ thống AI phản hồi chậm hoặc đang quá tải. Vui lòng thử lại sau.');
                    }
                    throw new Error(`Đã có lỗi xảy ra khi xử lý phản hồi cấu trúc từ AI: ${error.message}`);
                }
                
                await new Promise(res => setTimeout(res, 2000));
            }
        }
    }
}

module.exports = new AiService();

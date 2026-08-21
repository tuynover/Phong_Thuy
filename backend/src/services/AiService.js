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

    /**
     * Thực thi hành động gọi AI qua danh sách các mô hình dự phòng (Fallback Chain)
     * @param {Function} action - Hàm bất đồng bộ nhận tên modelName để thực thi gọi API
     * @param {Object} options - Các tùy chọn bổ sung
     */
    async _executeWithFallback(action, options = {}) {
        const chain = [
            options.model || this.defaultModelName,
            "gemini-3.1-flash-lite"
        ];
        
        // Loại bỏ trùng lặp và giữ nguyên thứ tự ưu tiên thử nghiệm
        const modelsToTry = Array.from(new Set(chain));
        
        let lastError = null;
        for (const modelName of modelsToTry) {
            try {
                return await action(modelName);
            } catch (error) {
                console.error(`[AiService] Mô hình ${modelName} gặp lỗi:`, error.message);
                lastError = error;
            }
        }
        throw lastError;
    }

    async generateInterpretation(prompt, options = {}, retries = 4) {
        if (!this.genAI) {
            throw new Error("Hệ thống chưa được cấu hình API Key của AI.");
        }

        try {
            return await this._executeWithFallback(async (modelName) => {
                const model = this.genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        maxOutputTokens: 8192
                    }
                });
                for (let attempt = 1; attempt <= retries + 1; attempt++) {
                    try {
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('AI Request Timeout')), 120000)
                        );

                        const generatePromise = model.generateContent(prompt);
                        const result = await Promise.race([generatePromise, timeoutPromise]);
                        const response = result.response;
                        return this.cleanMarkdown(response.text());
                    } catch (error) {
                        const waitTime = attempt * 2000;
                        console.error(`AI Generation Error (Attempt ${attempt}/${retries + 1} on ${modelName}): ${error.message} - Retrying in ${waitTime}ms...`);
                        if (attempt === retries + 1) {
                            throw error;
                        }
                        await new Promise(res => setTimeout(res, waitTime));
                    }
                }
            }, options);
        } catch (error) {
            console.error("All AI fallback models failed for generateInterpretation:", error);
            if (error.message.includes('SAFETY')) {
                throw new Error('Nội dung phân tích vi phạm chính sách an toàn của AI.');
            }
            throw new Error('Tính năng luận giải AI đang bảo trì, quý khách vui lòng thử lại sau.');
        }
    }

    async generateInterpretationStream(prompt, options = {}) {
        if (!this.genAI) {
            throw new Error("Hệ thống chưa được cấu hình API Key của AI.");
        }

        try {
            return await this._executeWithFallback(async (modelName) => {
                const model = this.genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        maxOutputTokens: 8192
                    }
                });
                const resultStream = await model.generateContentStream(prompt);
                
                // Mấu chốt: Bắt lỗi Promise response để ngăn chặn UnhandledRejection làm crash Node.js
                // Lỗi thực tế sẽ được bắt và xử lý bởi vòng lặp 'for await' khi đọc stream ở Controller.
                if (resultStream && resultStream.response) {
                    resultStream.response.catch(() => {});
                }
                
                return resultStream;
            }, options);
        } catch (error) {
            console.error("All AI fallback models failed for stream generation:", error);
            if (error.message.includes('SAFETY')) {
                throw new Error('Nội dung phân tích vi phạm chính sách an toàn của AI.');
            }
            throw new Error('Tính năng luận giải AI đang bảo trì, quý khách vui lòng thử lại sau.');
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

        try {
            return await this._executeWithFallback(async (modelName) => {
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
                        console.error(`AI Structured Generation Error (Attempt ${attempt} on ${modelName}):`, error.message);
                        if (attempt === retries + 1) {
                            throw error;
                        }
                        await new Promise(res => setTimeout(res, 2000));
                    }
                }
            }, options);
        } catch (error) {
            console.error("All AI fallback models failed for structured output:", error);
            throw new Error('Tính năng luận giải AI đang bảo trì, quý khách vui lòng thử lại sau.');
        }
    }
}

module.exports = new AiService();

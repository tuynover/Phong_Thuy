const { GoogleGenerativeAI } = require('@google/generative-ai');

class AiService {
    constructor() {
        this.genAI = null;
        if (process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        } else {
            console.warn("GEMINI_API_KEY is not set. AI Features will not work.");
        }
    }

    async generateInterpretation(prompt, retries = 2) {
        if (!this.genAI) {
            throw new Error("Hệ thống chưa được cấu hình API Key của AI.");
        }

        const model = this.genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            try {
                // Timeout promise
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AI Request Timeout')), 20000)
                );

                // Gemini API call
                const generatePromise = model.generateContent(prompt);

                const result = await Promise.race([generatePromise, timeoutPromise]);
                const response = result.response;
                return response.text();
            } catch (error) {
                console.error(`AI Generation Error (Attempt ${attempt}):`, error.message);
                
                // If it's the last attempt, throw the error
                if (attempt === retries + 1) {
                    if (error.message.includes('Timeout')) {
                        throw new Error('Hệ thống AI đang quá tải hoặc phản hồi chậm. Vui lòng thử lại sau.');
                    } else if (error.message.includes('429')) {
                        throw new Error('Hệ thống AI đang chạm giới hạn sử dụng. Vui lòng thử lại sau giây lát.');
                    } else if (error.message.includes('SAFETY')) {
                        throw new Error('Nội dung câu hỏi vi phạm chính sách an toàn của AI.');
                    }
                    throw new Error('Đã có lỗi xảy ra khi kết nối với máy chủ AI.');
                }
                
                // Wait for 2 seconds before retrying
                await new Promise(res => setTimeout(res, 2000));
            }
        }
    }
}

module.exports = new AiService();

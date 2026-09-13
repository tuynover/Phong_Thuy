const UserStatsService = require('../services/UserStatsService');
const logger = require('../services/LoggerService');

/**
 * Helper chuyên trách quản lý vòng đời luồng Server-Sent Events (SSE) và tương tác LLM
 */
class AiStreamHelper {
    /**
     * Khởi tạo kết nối SSE chuẩn với Heartbeat Ping 15s
     * @param {Object} req - Express Request
     * @param {Object} res - Express Response
     * @returns {Object} sseSession
     */
    static initSseSession(req, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Content-Encoding', 'none');

        let isConnectionOpen = true;
        let pingInterval = null;

        // Bắt sự kiện client ngắt kết nối
        req.on('close', () => {
            isConnectionOpen = false;
            if (pingInterval) clearInterval(pingInterval);
        });

        // Gửi gói dữ liệu SSE
        const sendSSE = (data) => {
            if (isConnectionOpen && !res.writableEnded) {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            }
        };

        // Gửi thông báo kết thúc SSE
        const sendDone = () => {
            if (isConnectionOpen && !res.writableEnded) {
                res.write(`data: "[DONE]"\n\n`);
                res.end();
            }
        };

        // Gửi thông báo lỗi qua SSE
        const sendError = (errorMessage) => {
            if (isConnectionOpen && !res.writableEnded) {
                res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
                res.end();
            }
        };

        // Heartbeat Ping 15 giây chống ngắt kết nối rác (AGENTS.md)
        pingInterval = setInterval(() => {
            if (isConnectionOpen && !res.writableEnded) {
                res.write(":\n\n");
            }
        }, 15000);
        if (pingInterval.unref) pingInterval.unref();

        const cleanup = () => {
            if (pingInterval) clearInterval(pingInterval);
        };

        return {
            sendSSE,
            sendDone,
            sendError,
            cleanup,
            isOpen: () => isConnectionOpen && !res.writableEnded
        };
    }

    /**
     * Tính toán số token sử dụng dựa trên metadata hoặc ước tính độ dài chuỗi
     */
    static calculateTokens(prompt, cleanedContent, usageMetadata = null) {
        const promptTokens = usageMetadata?.promptTokenCount || Math.ceil((prompt || '').length / 4);
        const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil((cleanedContent || '').length / 4);
        const tokensUsed = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);
        return { promptTokens, completionTokens, tokensUsed };
    }

    /**
     * Cập nhật số token tích lũy vào UserStatsService O(1)
     */
    static recordInterpretTokens(userId, system, tokensUsed) {
        if (userId && userId !== 'guest' && tokensUsed > 0) {
            try {
                UserStatsService.incrementInterpretTokens(userId, system, tokensUsed);
            } catch (err) {
                logger.warn(`[AiStreamHelper] Failed to increment interpret tokens for user [${userId}]: ${err.message}`);
            }
        }
    }

    /**
     * Cập nhật số token chat tích lũy vào UserStatsService O(1)
     */
    static recordChatTokens(userId, system, tokensUsed) {
        if (userId && userId !== 'guest' && tokensUsed > 0) {
            try {
                UserStatsService.incrementChatTokens(userId, system, tokensUsed);
            } catch (err) {
                logger.warn(`[AiStreamHelper] Failed to increment chat tokens for user [${userId}]: ${err.message}`);
            }
        }
    }
}

module.exports = AiStreamHelper;

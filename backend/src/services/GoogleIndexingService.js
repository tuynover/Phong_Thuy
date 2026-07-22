const { JWT } = require('google-auth-library');
const logger = require('./LoggerService');

const console = {
    log: (msg, ...args) => logger.info(args.length ? `${msg} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}` : msg),
    warn: (msg, ...args) => logger.warn(args.length ? `${msg} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}` : msg),
    error: (msg, ...args) => {
        const err = args.find(a => a instanceof Error);
        const otherArgs = args.filter(a => !(a instanceof Error));
        const finalMsg = otherArgs.length ? `${msg} ${otherArgs.join(' ')}` : msg;
        logger.error(finalMsg, err || null);
    }
};

class GoogleIndexingService {
    /**
     * Lấy JWT Client cho Google Indexing API từ cấu hình môi trường
     * @returns {JWT|null} JWT client hoặc null nếu không cấu hình
     */
    static getClient() {
        try {
            let credentials = null;

            // 1. Thử đọc từ biến môi trường GOOGLE_INDEXING_CREDENTIALS (chuỗi JSON)
            if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
                try {
                    credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
                } catch (e) {
                    console.error('[GoogleIndexingService] Lỗi parse JSON từ biến môi trường GOOGLE_INDEXING_CREDENTIALS:', e);
                }
            }

            // 2. Nếu không có, thử đọc từ các biến môi trường riêng lẻ
            if (!credentials) {
                const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
                const privateKey = process.env.GOOGLE_PRIVATE_KEY;
                if (clientEmail && privateKey) {
                    credentials = {
                        client_email: clientEmail,
                        private_key: privateKey
                    };
                }
            }

            // 3. Nếu không có credentials hợp lệ, log cảnh báo và trả về null
            if (!credentials || !credentials.client_email || !credentials.private_key) {
                console.warn('[GoogleIndexingService] Chưa cấu hình Google Service Account credentials. Bỏ qua gọi Indexing API.');
                return null;
            }

            // 3. Khởi tạo JWT client
            const client = new JWT({
                email: credentials.client_email,
                key: credentials.private_key.replace(/\\n/g, '\n'), // Xử lý xuống dòng trong private key
                scopes: ['https://www.googleapis.com/auth/indexing'],
            });

            return client;
        } catch (error) {
            console.error('[GoogleIndexingService] Lỗi khi tạo JWT Client:', error);
            return null;
        }
    }

    /**
     * Thông báo thay đổi URL lên Google Indexing API
     * @param {string} url URL cần thông báo (phải có cả domain và protocol đầy đủ)
     * @param {'URL_UPDATED'|'URL_DELETED'} actionType Loại hành động (URL_UPDATED hoặc URL_DELETED)
     * @returns {Promise<{success: boolean, data?: any, error?: any}>}
     */
    static async publishUrl(url, actionType = 'URL_UPDATED') {
        try {
            const client = this.getClient();
            if (!client) {
                return { success: false, reason: 'Credentials not configured' };
            }

            console.log(`[GoogleIndexingService] Đang gửi yêu cầu ${actionType} cho URL: ${url}`);

            const response = await client.request({
                url: 'https://indexing.googleapis.com/v1/urlNotifications:publish',
                method: 'POST',
                data: {
                    url: url,
                    type: actionType
                }
            });

            console.log(`[GoogleIndexingService] Đã gửi thông báo thành công cho ${url}. Phản hồi:`, response.data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`[GoogleIndexingService] Lỗi khi gọi Google Indexing API cho ${url}:`, error.message, error.response ? error.response.data : '');
            return { success: false, error: error.message };
        }
    }
}

module.exports = GoogleIndexingService;

/**
 * AppConfig: Cấu hình tập trung toàn bộ hệ thống backend
 */
const appConfig = {
    /**
     * Tên miền ứng dụng chính (Front-end / Public domain)
     * Đọc từ APP_DOMAIN, BASE_URL hoặc mặc định 'https://tuynover.ddns.net'
     */
    get appDomain() {
        return (process.env.APP_DOMAIN || process.env.BASE_URL || 'https://tuynover.ddns.net').replace(/\/+$/, '');
    },

    /**
     * URL API nội bộ / server URL
     */
    get apiUrl() {
        return (process.env.API_URL || process.env.SERVER_URL || 'http://localhost:3001').replace(/\/+$/, '');
    },

    /**
     * Cờ môi trường production
     */
    get isProduction() {
        return process.env.NODE_ENV === 'production';
    },

    /**
     * Môi trường Node hiện tại
     */
    get nodeEnv() {
        return process.env.NODE_ENV || 'development';
    },

    /**
     * Danh sách nguồn CORS được cấp phép
     */
    get corsOrigins() {
        if (process.env.CORS_ORIGINS) {
            return process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
        }
        const domain = this.appDomain;
        const defaults = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
            'http://localhost:3000',
            'https://tuynover.ddns.net',
            'https://tuynover.giize.com',
            'https://tuynover.duckdns.org'
        ];
        if (domain && !defaults.includes(domain)) {
            defaults.push(domain);
        }
        return defaults;
    }
};

module.exports = appConfig;

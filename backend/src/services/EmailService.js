const nodemailer = require('nodemailer');

class EmailService {
    static getTransporter() {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    static async sendEmail({ to, subject, html }) {
        try {
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.warn('[EmailService] SMTP credentials not configured. Skipping email.');
                return { success: false, reason: 'Credentials not configured' };
            }

            const transporter = this.getTransporter();
            const mailOptions = {
                from: process.env.SMTP_FROM || `"Phong Thủy Luận Giải" <${process.env.SMTP_USER}>`,
                to,
                subject,
                html
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('[EmailService] Error sending email:', error);
            return { success: false, error };
        }
    }
}

module.exports = EmailService;

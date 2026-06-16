const HexagramRecord = require('../models/HexagramRecord');
const User = require('../models/User');
const Notification = require('../models/Notification');
const EmailService = require('./EmailService');
const { Solar } = require('lunar-javascript');
const SystemLog = require('../models/SystemLog');
const AdminNotification = require('../models/AdminNotification');
const BaziRecord = require('../models/BaziRecord');
const TuViRecord = require('../modules/tu-vi/models/TuViRecord');
const BanAppeal = require('../models/BanAppeal');

function getDayDifference(date1, date2) {
    const d1 = new Date(date1.getTime() + 7 * 60 * 60 * 1000);
    const d2 = new Date(date2.getTime() + 7 * 60 * 60 * 1000);
    d1.setUTCHours(0, 0, 0, 0);
    d2.setUTCHours(0, 0, 0, 0);
    const diffTime = d1.getTime() - d2.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function purgeSoftDeletedUsers() {
    console.log('[NotificationScheduler] Purging soft-deleted users inactive for 30+ days...');
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const expiredUsers = await User.find({ isDeleted: true, updatedAt: { $lt: thirtyDaysAgo } });

        console.log(`[NotificationScheduler] Found ${expiredUsers.length} users to purge.`);

        for (const user of expiredUsers) {
            const userId = user._id;
            await BaziRecord.deleteMany({ userId });
            await HexagramRecord.deleteMany({ userId });
            await TuViRecord.deleteMany({ userId });
            await BanAppeal.deleteMany({ userId });
            await Notification.deleteMany({ userId });
            await User.deleteOne({ _id: userId });
            console.log(`[NotificationScheduler] Permanently purged user: ${user.email}`);
        }
    } catch (err) {
        console.error('[NotificationScheduler] Error during purging soft-deleted users:', err);
    }
}

async function checkAndSendNotifications() {
    console.log('[NotificationScheduler] Running daily check...');
    
    // 1. Daily Credit Increment (+1 for user/vip)
    try {
        console.log('[NotificationScheduler] Running daily credit increment...');
        const creditRes = await User.updateMany(
            { role: { $in: ['user', 'vip'] }, status: 'active', isDeleted: false },
            { $inc: { credits: 1 } }
        );
        console.log(`[NotificationScheduler] Daily credit increment completed. Updated ${creditRes.modifiedCount || 0} users.`);
    } catch (err) {
        console.error('[NotificationScheduler] Error during daily credit increment:', err);
    }

    // 1b. Purge expired soft-deleted users
    await purgeSoftDeletedUsers();

    try {
        const today = new Date();
        const todaySolar = Solar.fromDate(today);
        const todayLunar = todaySolar.getLunar();
        const todayLunarStr = `ngày ${todayLunar.getDay()} tháng ${todayLunar.getMonth()} âm lịch (ngày ${todayLunar.getDayInGanZhiExact()})`;

        const records = await HexagramRecord.find({
            userId: { $ne: 'guest' },
            'ungKy.status': 'pending'
        });

        for (const record of records) {
            const user = await User.findById(record.userId);
            if (!user || !user.email) continue;

            let updated = false;

            for (const item of record.ungKy) {
                if (item.status !== 'pending') continue;

                const diffDays = getDayDifference(item.solarDate, today);

                if (diffDays <= 0) {
                    item.status = 'completed';
                    updated = true;
                    continue;
                }

                const elapsedDays = getDayDifference(today, record.dateCast || record.createdAt);
                const primaryName = record.primaryHexagram?.name || 'Chưa rõ';
                const secondaryName = record.transformedHexagram?.name || 'Không có';
                
                let title = '';
                let message = '';
                let shouldSendEmail = false;

                if (item.isMonthOnly) {
                    if (diffDays === 3 && !item.notified3Days) {
                        title = `Sắp đến tháng ứng kỳ`;
                        message = `Ứng kỳ "${item.originalText}" của quẻ gieo: "${record.question}" còn 3 ngày nữa bắt đầu.`;
                        item.notified3Days = true;
                        shouldSendEmail = true;
                        updated = true;
                    }
                } else {
                    if (diffDays === 3 && !item.notified3Days) {
                        title = `Ứng kỳ còn 3 ngày`;
                        message = `Ứng kỳ "${item.originalText}" của quẻ gieo: "${record.question}" còn 3 ngày nữa sẽ đến.`;
                        item.notified3Days = true;
                        shouldSendEmail = true;
                        updated = true;
                    } else if (diffDays === 2 && !item.notified2Days) {
                        title = `Ứng kỳ còn 2 ngày`;
                        message = `Ứng kỳ "${item.originalText}" của quẻ gieo: "${record.question}" còn 2 ngày nữa sẽ đến.`;
                        item.notified2Days = true;
                        updated = true;
                    } else if (diffDays === 1 && !item.notified1Day) {
                        title = `Ứng kỳ còn 1 ngày`;
                        message = `Ứng kỳ "${item.originalText}" của quẻ gieo: "${record.question}" ngày mai sẽ đến!`;
                        item.notified1Day = true;
                        updated = true;
                    }
                }

                if (title && message) {
                    await Notification.create({
                        userId: record.userId,
                        hexagramId: record._id || record.id,
                        title,
                        message,
                        type: 'ung_ky'
                    });
                    console.log(`[NotificationScheduler] Created UI notification for user ${user.email}: ${title}`);
                }

                if (shouldSendEmail) {
                    const emailSubject = `[Phong Thủy Luận Giải] Nhắc nhở ứng kỳ quẻ Kinh Dịch của bạn`;
                    const castSolarStr = (record.dateCast || record.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
                    
                    const emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
                            <h2 style="color: #92400e; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">Nhắc Nhở Ứng Kỳ Gieo Quẻ</h2>
                            <p>Xin chào <strong>${user.name}</strong>,</p>
                            <p>Hôm nay ngày <strong>${today.toLocaleDateString('vi-VN')} Dương lịch</strong> (nhằm ngày <em>${todayLunarStr}</em>), chúng tôi xin gửi thông báo nhắc nhở về quẻ dịch bạn đã gieo trên hệ thống <strong>Phong Thủy Luận Giải</strong> của chúng tôi.</p>
                            
                            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0 0 8px 0;"><strong>Chi tiết quẻ gieo:</strong></p>
                                <ul style="margin: 0; padding-left: 20px;">
                                    <li>Ngày gieo: ${castSolarStr}</li>
                                    <li>Câu hỏi: "<em>${record.question}</em>"</li>
                                    <li>Quẻ chính: <strong>${primaryName}</strong></li>
                                    <li>Quẻ biến: <strong>${secondaryName}</strong></li>
                                </ul>
                            </div>

                            <p>Tính cho tới hôm nay đã được <strong>${elapsedDays} ngày</strong> kể từ lúc bạn gieo quẻ.</p>
                            <p style="font-size: 16px;">Hiện tại đã sắp đến thời điểm <strong>ứng kỳ</strong> của quẻ dịch này, dự đoán là: <strong style="color: #b45309;">${item.originalText}</strong>.</p>
                            
                            <p style="margin-top: 20px; font-style: italic; color: #4b5563;">Mong bạn lưu ý để chuẩn bị kế hoạch, điều chỉnh tâm lý hành vi cho phù hợp nhằm đón lành tránh dữ.</p>
                            
                            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #9ca3af; text-align: center;">Đây là email tự động từ hệ thống Phong Thủy Luận Giải. Vui lòng không trả lời trực tiếp email này.</p>
                        </div>
                    `;

                    await EmailService.sendEmail({
                        to: user.email,
                        subject: emailSubject,
                        html: emailHtml
                    });
                }
            }

            if (updated) {
                await record.save();
            }
        }
    } catch (error) {
        console.error('[NotificationScheduler] Error during daily notifications check:', error);
    }
}

let checkInterval = null;
let spikeInterval = null;
let lastRunDay = null;

async function scanResourceSpikes() {
    console.log('[NotificationScheduler] Scanning for request and token spikes...');
    try {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        // 1. Scan for request spikes by IP
        const requestSpikes = await SystemLog.aggregate([
            { $match: { timestamp: { $gte: tenMinutesAgo } } },
            { $group: { _id: '$ip', count: { $sum: 1 }, userId: { $first: '$userId' } } },
            { $match: { count: { $gt: 150 } } }
        ]);

        for (const spike of requestSpikes) {
            const title = `Phát hiện đột biến Request từ IP: ${spike._id}`;
            const message = `Địa chỉ IP ${spike._id} (User ID: ${spike.userId}) đã thực hiện ${spike.count} yêu cầu trong 10 phút qua.`;
            
            const exists = await AdminNotification.findOne({
                type: 'request_spike',
                title,
                createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
            });

            if (!exists) {
                await AdminNotification.create({
                    type: 'request_spike',
                    title,
                    message,
                    metadata: { ip: spike._id, count: spike.count, userId: spike.userId }
                });
                console.warn(`[NotificationScheduler] Alert: Request spike detected for ${spike._id}`);
            }
        }

        // 2. Scan for token spikes by user
        const recordsSearch = [
            { model: BaziRecord, name: 'Bát Tự' },
            { model: HexagramRecord, name: 'Kinh Dịch' },
            { model: TuViRecord, name: 'Tử Vi' }
        ];

        const tokenSpikeThreshold = 30000; // 30,000 tokens
        const userTokenMap = new Map();

        for (const { model, name } of recordsSearch) {
            const items = await model.find({
                createdAt: { $gte: tenMinutesAgo },
                'aiInterpretation.tokensUsed': { $gt: 0 }
            }).select('userId aiInterpretation.tokensUsed').lean();

            for (const item of items) {
                const uid = item.userId;
                if (!uid || uid === 'guest' || uid === 'anonymous') continue;
                const tokens = item.aiInterpretation.tokensUsed || 0;
                const current = userTokenMap.get(uid) || { tokens: 0, sources: [] };
                current.tokens += tokens;
                if (!current.sources.includes(name)) current.sources.push(name);
                userTokenMap.set(uid, current);
            }
        }

        for (const [uid, data] of userTokenMap.entries()) {
            if (data.tokens > tokenSpikeThreshold) {
                const userObj = await User.findById(uid).select('email name').lean();
                const userDisplay = userObj ? `${userObj.email} (${userObj.name})` : uid;
                const title = `Phát hiện tiêu dùng Token đột biến từ User: ${userDisplay}`;
                const message = `Người dùng ${userDisplay} đã tiêu thụ ${data.tokens} tokens trong 10 phút qua từ các chức năng: ${data.sources.join(', ')}.`;

                const exists = await AdminNotification.findOne({
                    type: 'token_spike',
                    title,
                    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
                });

                if (!exists) {
                    await AdminNotification.create({
                        type: 'token_spike',
                        title,
                        message,
                        metadata: { userId: uid, tokens: data.tokens, sources: data.sources }
                    });
                    console.warn(`[NotificationScheduler] Alert: Token spike detected for user ${uid}`);
                }
            }
        }
    } catch (error) {
        console.error('[NotificationScheduler] Error during resource spike scanning:', error);
    }
}

function startScheduler() {
    if (process.env.NODE_ENV === 'test') {
        console.log('[NotificationScheduler] Skipping start in test environment.');
        return;
    }
    const todayStr = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' });
    lastRunDay = todayStr;
    
    setTimeout(() => {
        checkAndSendNotifications();
        scanResourceSpikes();
    }, 5000);

    // Daily check every hour
    checkInterval = setInterval(() => {
        const currentDayStr = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' });
        if (lastRunDay !== currentDayStr) {
            checkAndSendNotifications();
            lastRunDay = currentDayStr;
        }
    }, 3600000); 

    // Spike check every 10 minutes
    spikeInterval = setInterval(() => {
        scanResourceSpikes();
    }, 600000);
    
    console.log('[NotificationScheduler] Started successfully.');
}

function stopScheduler() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
    }
    if (spikeInterval) {
        clearInterval(spikeInterval);
        spikeInterval = null;
    }
}

module.exports = {
    startScheduler,
    stopScheduler,
    checkAndSendNotifications
};

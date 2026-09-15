const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function readSSEStream(res, name) {
    if (!res.ok) {
        const errText = await res.text();
        console.error(`[SSE ${name}] HTTP ${res.status} Error:`, errText);
        throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let totalText = '';
    let chunkCount = 0;
    let errorSeen = null;

    console.log(`\n--- Bắt đầu nhận luồng SSE [${name}] ---`);
    const startTime = Date.now();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
                const dataStr = trimmed.replace(/^data:\s*/, '');
                if (dataStr === '[DONE]') {
                    console.log(`[SSE ${name}] => Nhận tín hiệu [DONE] hoàn tất.`);
                    continue;
                }
                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.chunk) {
                        chunkCount++;
                        totalText += parsed.chunk;
                        if (chunkCount === 1) {
                            console.log(`[SSE ${name}] Chunk đầu tiên (${Date.now() - startTime}ms): "${parsed.chunk.slice(0, 60).replace(/\n/g, ' ')}..."`);
                        }
                    } else if (parsed.message) {
                        console.log(`[SSE ${name}] Tiến trình: ${parsed.message}`);
                    } else if (parsed.error) {
                        errorSeen = parsed.error;
                        console.error(`[SSE ${name}] Lỗi trong stream:`, parsed.error);
                    }
                } catch (e) {
                    totalText += dataStr;
                }
            }
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`--- Kết thúc [${name}] trong ${duration}s | Tổng ký tự: ${totalText.length} | Chunks: ${chunkCount} ---`);

    if (errorSeen) {
        throw new Error(`Stream [${name}] gặp lỗi: ${errorSeen}`);
    }
    if (totalText.includes('[Lỗi tạo bài') || totalText.includes('Tính năng luận giải AI đang bảo trì')) {
        throw new Error(`Stream [${name}] trả về thông báo lỗi bảo trì: ${totalText.slice(0, 200)}`);
    }

    return { totalText, duration, chunkCount };
}

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../core/models/User');
require('dotenv').config();

async function getAuthToken() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'cobatuoc@gmail.com' });
    if (!user) throw new Error('User not found');
    const token = jwt.sign(
        {
            user: {
                id: user._id,
                email: user.email,
                role: user.role || 'user',
                tokenVersion: user.tokenVersion || 0
            }
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    await mongoose.disconnect();
    return token;
}

async function run() {
    console.log("=== KIỂM THỬ LUẬN GIẢI CHUYÊN SÂU (VIP MODE) CHO BÁT TỰ & HÔN NHÂN & KINH DỊCH ===");

    const token = await getAuthToken();
    console.log("=> Lấy JWT Token thành công! Token:", token.slice(0, 20) + "...");

    // VIP BÁT TỰ
    console.log("\n==========================================");
    console.log("TEST 1: Luận giải Bát Tự (VIP Mode)");
    console.log("==========================================");
    const baziCreateRes = await fetch(`${BASE_URL}/bazi/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            name: "Lê Minh Tuấn",
            gender: 1,
            date: "20/10/1993",
            time: "15:45"
        })
    });
    const baziRecord = await baziCreateRes.json();
    const baziId = baziRecord.recordId || baziRecord.record?._id;
    console.log(`=> Record ID: ${baziId}`);

    const baziInterpretRes = await fetch(`${BASE_URL}/ai/bazi/${baziId}/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mode: 'vip' })
    });
    const baziResult = await readSSEStream(baziInterpretRes, 'Bát Tự VIP');
    console.log(`=> BÁT TỰ VIP THÀNH CÔNG! Độ dài: ${baziResult.totalText.length} ký tự.`);

    // VIP HÔN NHÂN
    console.log("\n==========================================");
    console.log("TEST 2: Luận giải Hôn Nhân (VIP Mode)");
    console.log("==========================================");
    const marriageCreateRes = await fetch(`${BASE_URL}/marriage/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            male: { date: "10/05/1991", time: "07:30" },
            female: { date: "18/12/1994", time: "16:00" }
        })
    });
    const marriageRecord = await marriageCreateRes.json();
    const marriageId = marriageRecord.recordId || marriageRecord._id;
    console.log(`=> Record ID: ${marriageId}`);

    const marriageInterpretRes = await fetch(`${BASE_URL}/ai/marriage/${marriageId}/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mode: 'vip' })
    });
    const marriageResult = await readSSEStream(marriageInterpretRes, 'Hôn Nhân VIP');
    console.log(`=> HÔN NHÂN VIP THÀNH CÔNG! Độ dài: ${marriageResult.totalText.length} ký tự.`);

    // VIP KINH DỊCH
    console.log("\n==========================================");
    console.log("TEST 3: Luận giải Kinh Dịch (VIP Mode)");
    console.log("==========================================");
    const ichingCreateRes = await fetch(`${BASE_URL}/iching/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            question: "Kế hoạch mở rộng chi nhánh vào quý 3 có thành công không?",
            lines: [
                { type: 1, moving: false },
                { type: 0, moving: true },
                { type: 1, moving: false },
                { type: 1, moving: false },
                { type: 0, moving: false },
                { type: 1, moving: true }
            ]
        })
    });
    const ichingRecord = await ichingCreateRes.json();
    const ichingId = ichingRecord.recordId || ichingRecord._id;
    console.log(`=> Record ID: ${ichingId}`);

    const ichingInterpretRes = await fetch(`${BASE_URL}/ai/iching/${ichingId}/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mode: 'vip' })
    });
    const ichingResult = await readSSEStream(ichingInterpretRes, 'Kinh Dịch VIP');
    console.log(`=> KINH DỊCH VIP THÀNH CÔNG! Độ dài: ${ichingResult.totalText.length} ký tự.`);

    console.log("\n====================================================");
    console.log("🎉 TẤT CẢ CÁC BÀI LUẬN GIẢI CHUYÊN SÂU (VIP) ĐỀU HOÀN THÀNH 100% THÀNH CÔNG!");
    console.log("====================================================");
}

run().catch(err => {
    console.error("❌ Kiểm thử VIP thất bại:", err);
    process.exit(1);
});

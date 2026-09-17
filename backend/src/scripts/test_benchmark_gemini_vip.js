const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}/api`;
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

async function runBenchmark() {
    console.log("==========================================================================");
    console.log("🚀 KHỞI ĐỘNG BENCHMARK: LUẬN GIẢI CHUYÊN SÂU BÁT TỰ (100% GOOGLE GEMINI SDK)");
    console.log("==========================================================================");

    const token = await getAuthToken();
    console.log("✅ Đã xác thực người dùng thành công.");

    // 1. Tạo bản ghi Bát Tự
    console.log("\n[Bước 1] Lập lá số Bát Tự thực tế (Trụ: Quý Dậu - Nhâm Tuất - Mậu Thìn - Canh Thân)...");
    const createStart = Date.now();
    const createRes = await fetch(`${BASE_URL}/bazi/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            name: "Lê Minh Tuấn",
            gender: 1,
            date: "20/10/1993",
            time: "15:45"
        })
    });
    const recordData = await createRes.json();
    const recordId = recordData.recordId || recordData.record?._id;
    console.log(`✅ Lập lá số thành công trong ${Date.now() - createStart}ms. Record ID: ${recordId}`);

    // 2. Kích hoạt Luận giải chuyên sâu (VIP SSE)
    console.log("\n[Bước 2] Kích hoạt Luận Giải Chuyên Sâu (POST /interpret)...");
    const interpretStart = Date.now();
    const interpretRes = await fetch(`${BASE_URL}/ai/bazi/${recordId}/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mode: 'vip' })
    });

    if (!interpretRes.ok) {
        const errText = await interpretRes.text();
        throw new Error(`HTTP ${interpretRes.status}: ${errText}`);
    }

    const reader = interpretRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    let firstChunkTime = null;
    const progressEvents = [];

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
                    continue;
                }
                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.chunk) {
                        if (!firstChunkTime) {
                            firstChunkTime = Date.now();
                            const ttft = ((firstChunkTime - interpretStart) / 1000).toFixed(2);
                            console.log(`\n⚡ [TTFT] Nhận Chunk đầu tiên sau: ${ttft}s`);
                        }
                        accumulatedText += parsed.chunk;
                    } else if (parsed.message) {
                        const elapsed = ((Date.now() - interpretStart) / 1000).toFixed(1);
                        console.log(`[+${elapsed}s] 📍 Tiến trình: ${parsed.message}`);
                        progressEvents.push({ time: elapsed, msg: parsed.message, stage: parsed.stage });
                    }
                } catch (e) {
                    accumulatedText += dataStr;
                }
            }
        }
    }

    const totalTime = ((Date.now() - interpretStart) / 1000).toFixed(2);
    const ttftSeconds = firstChunkTime ? ((firstChunkTime - interpretStart) / 1000).toFixed(2) : totalTime;

    console.log("\n==========================================================================");
    console.log("📊 KẾT QUẢ ĐO LƯỜNG HIỆU NĂNG THỰC TẾ (BENCHMARK RESULTS)");
    console.log("==========================================================================");
    console.log(`- Thời gian phản hồi ban đầu (TTFT):       ${ttftSeconds} s`);
    console.log(`- Tổng thời gian hoàn thành (Completion):  ${totalTime} s`);
    console.log(`- Tổng dung lượng bài luận giải:           ${accumulatedText.length} ký tự (~${Math.round(accumulatedText.split(/\s+/).length)} từ)`);
    console.log(`- Tốc độ sinh trung bình:                  ${(accumulatedText.length / parseFloat(totalTime)).toFixed(1)} ký tự/s`);

    // Kiểm tra chất lượng & quy tắc
    console.log("\n==========================================================================");
    console.log("🔍 THẨM ĐỊNH CHẤT LƯỢNG HỌC THUẬT & ĐỘ CHÍNH XÁC (QUALITY & ACCURACY CHECK)");
    console.log("==========================================================================");

    const hasNgươi = /ngươi/i.test(accumulatedText);
    const hasVip = /\bvip\b/i.test(accumulatedText);
    const hasChinese = /[\u4e00-\u9fa5]/.test(accumulatedText);
    const hasKhoTai = /kho tài|thủy khố|thìn/i.test(accumulatedText);
    const hasSWOT = /SWOT|Ma Trận Định Vị Bản Mệnh/i.test(accumulatedText);

    // Kiểm tra tính hiện diện của mục Giải thích bình dân
    const laymanMatches = accumulatedText.match(/💡\s*Góc Nhìn Dễ Hiểu|Lời Khuyên Cho Bạn|Giải Thích Bình Dân/gi) || [];
    const chaptersCount = (accumulatedText.match(/##\s*CHƯƠNG\s*\d+/gi) || []).length;

    console.log(`1. Tuân thủ xưng hô (Không có từ 'ngươi'):     ${!hasNgươi ? '✅ ĐẠT' : '❌ LỖI (Phát hiện từ ngươi)'}`);
    console.log(`2. Khử từ 'VIP' (Không có từ 'VIP'):           ${!hasVip ? '✅ ĐẠT' : '❌ LỖI (Phát hiện từ VIP)'}`);
    console.log(`3. Thuần Việt 100% (Không chứa Hán tự thô):    ${!hasChinese ? '✅ ĐẠT' : '❌ LỖI (Có chữ Hán)'}`);
    console.log(`4. Nhận diện đúng Kho Tài (Thìn là Thủy Khố): ${hasKhoTai ? '✅ ĐẠT' : '⚠️ CẦN LƯU Ý'}`);
    console.log(`5. Ma trận SWOT Mở đầu & Chiến lược Điều hòa:  ${hasSWOT ? '✅ ĐẠT' : '⚠️ KHÔNG CÓ SWOT'}`);
    console.log(`6. Số chương chuyên sâu được sinh:             ${chaptersCount} chương`);
    console.log(`7. Số mục '💡 Góc Nhìn Dễ Hiểu / Bình Dân':    ${laymanMatches.length} mục (${laymanMatches.length > 0 ? '✅ ĐÃ XUẤT HIỆN' : '❌ THIẾU'})`);

    // Trích xuất 1 đoạn Giải thích bình dân mẫu
    const laymanSnippetIdx = accumulatedText.indexOf('💡');
    if (laymanSnippetIdx !== -1) {
        const snippet = accumulatedText.substring(laymanSnippetIdx, laymanSnippetIdx + 350).replace(/\n+/g, ' ');
        console.log(`\n📝 MẪU ĐOẠN GIẢI THÍCH BÌNH DÂN TRÍCH XUẤT TỪ BÀI VIẾT:\n"${snippet}..."`);
    }

    console.log("\n🎉 HOÀN TẤT KIỂM THỬ BENCHMARK!");
}

runBenchmark().catch(err => {
    console.error("❌ Benchmark gặp lỗi:", err);
    process.exit(1);
});

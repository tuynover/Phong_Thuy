const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function readSSEStream(res, name) {
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

async function run() {
    console.log("=== KIỂM THỬ LUẬN GIẢI AI CHO 3 PHÂN HỆ: BÁT TỰ, KINH DỊCH, HÔN NHÂN ===");

    // 1. Đăng nhập
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cobatuoc@gmail.com', password: 'password123' })
    });

    let token;
    if (loginRes.ok) {
        const d = await loginRes.json();
        token = d.token;
    } else {
        const loginRes2 = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'cobatuoc@gmail.com', password: '12345678' })
        });
        if (!loginRes2.ok) {
            throw new Error(`Đăng nhập thất bại: ${await loginRes2.text()}`);
        }
        const d = await loginRes2.json();
        token = d.token;
    }
    console.log("=> Đăng nhập thành công!");

    // ==========================================
    // TEST 1: BÁT TỰ (BAZI)
    // ==========================================
    console.log("\n==========================================");
    console.log("TEST 1: Luận giải Bát Tự (Standard Mode)");
    console.log("==========================================");
    const baziCreateRes = await fetch(`${BASE_URL}/bazi/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            name: "Nguyễn Văn Test",
            gender: 1,
            date: "15/08/1990",
            time: "09:30"
        })
    });
    if (!baziCreateRes.ok) throw new Error(`Tạo Bát Tự thất bại: ${await baziCreateRes.text()}`);
    const baziRecord = await baziCreateRes.json();
    const baziId = baziRecord.recordId || baziRecord.record?._id;
    console.log(`=> Tạo Bát Tự thành công! Record ID: ${baziId}`);

    const baziInterpretRes = await fetch(`${BASE_URL}/ai/bazi/${baziId}/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mode: 'standard' })
    });
    if (!baziInterpretRes.ok) throw new Error(`Gọi Luận giải Bát Tự thất bại: ${await baziInterpretRes.text()}`);
    const baziResult = await readSSEStream(baziInterpretRes, 'Bát Tự Standard');
    console.log(`=> BÁT TỰ THÀNH CÔNG! Độ dài: ${baziResult.totalText.length} ký tự.`);

    // ==========================================
    // TEST 2: KINH DỊCH (ICHING)
    // ==========================================
    console.log("\n==========================================");
    console.log("TEST 2: Luận giải Kinh Dịch (Standard Mode)");
    console.log("==========================================");
    const ichingCreateRes = await fetch(`${BASE_URL}/iching/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            question: "Công việc kinh doanh và tài chính tháng này thế nào?",
            lines: [
                { type: 1, moving: true },
                { type: 1, moving: false },
                { type: 1, moving: false },
                { type: 1, moving: false },
                { type: 1, moving: true },
                { type: 1, moving: false }
            ]
        })
    });
    if (!ichingCreateRes.ok) throw new Error(`Tạo Kinh Dịch thất bại: ${await ichingCreateRes.text()}`);
    const ichingRecord = await ichingCreateRes.json();
    const ichingId = ichingRecord.recordId || ichingRecord.record?._id || ichingRecord._id;
    console.log(`=> Tạo Kinh Dịch thành công! Record ID: ${ichingId}`);

    const ichingInterpretRes = await fetch(`${BASE_URL}/ai/iching/${ichingId}/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mode: 'standard' })
    });
    if (!ichingInterpretRes.ok) throw new Error(`Gọi Luận giải Kinh Dịch thất bại: ${await ichingInterpretRes.text()}`);
    const ichingResult = await readSSEStream(ichingInterpretRes, 'Kinh Dịch Standard');
    console.log(`=> KINH DỊCH THÀNH CÔNG! Độ dài: ${ichingResult.totalText.length} ký tự.`);

    // ==========================================
    // TEST 3: HÔN NHÂN (MARRIAGE)
    // ==========================================
    console.log("\n==========================================");
    console.log("TEST 3: Luận giải Hôn Nhân (Standard Mode)");
    console.log("==========================================");
    const marriageCreateRes = await fetch(`${BASE_URL}/marriage/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            male: {
                date: "12/03/1992",
                time: "08:15"
            },
            female: {
                date: "25/09/1994",
                time: "14:20"
            }
        })
    });
    if (!marriageCreateRes.ok) throw new Error(`Tạo Hôn Nhân thất bại: ${await marriageCreateRes.text()}`);
    const marriageRecord = await marriageCreateRes.json();
    const marriageId = marriageRecord.recordId || marriageRecord.record?._id || marriageRecord._id;
    console.log(`=> Tạo Hôn Nhân thành công! Record ID: ${marriageId}`);

    const marriageInterpretRes = await fetch(`${BASE_URL}/ai/marriage/${marriageId}/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mode: 'standard' })
    });
    if (!marriageInterpretRes.ok) throw new Error(`Gọi Luận giải Hôn Nhân thất bại: ${await marriageInterpretRes.text()}`);
    const marriageResult = await readSSEStream(marriageInterpretRes, 'Hôn Nhân Standard');
    console.log(`=> HÔN NHÂN THÀNH CÔNG! Độ dài: ${marriageResult.totalText.length} ký tự.`);

    console.log("\n====================================================");
    console.log("🎉 TẤT CẢ 3 PHÂN HỆ (BÁT TỰ, KINH DỊCH, HÔN NHÂN) ĐỀU ĐÃ ĐƯỢC LUẬN GIẢI THÀNH CÔNG 100% KHÔNG LỖI!");
    console.log("====================================================");
}

run().catch(err => {
    console.error("❌ Kiểm thử thất bại:", err);
    process.exit(1);
});

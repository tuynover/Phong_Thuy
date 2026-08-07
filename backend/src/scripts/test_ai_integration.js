const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTest() {
    console.log("=== BẮT ĐẦU CHẠY KIỂM THỬ TÍCH HỢP AI BÁT TỰ ===");
    console.log(`Đang kết nối tới server: ${BASE_URL}\n`);

    try {
        // Step 1: Đăng nhập
        console.log("1. Đăng nhập tài khoản...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'cobatuoc@gmail.com', password: '12345678' })
        });

        if (!loginRes.ok) {
            const err = await loginRes.json();
            throw new Error(`Đăng nhập thất bại: ${err.error || loginRes.statusText}`);
        }

        const authData = await loginRes.json();
        const token = authData.token;
        const userId = authData.user?.id || authData.user?._id;
        console.log(`=> Đăng nhập thành công! Token: ${token.substring(0, 15)}...`);
        console.log(`=> User ID: ${userId}\n`);

        // Step 2: Lập lá số Bát tự
        console.log("2. Lập lá số Bát Tự...");
        const baziRes = await fetch(`${BASE_URL}/bazi/analyze`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                date: '15/12/1995',
                time: '10:30',
                gender: 1,
                name: 'Đương số Test'
            })
        });

        if (!baziRes.ok) {
            const err = await baziRes.json();
            throw new Error(`Lập lá số thất bại: ${err.error || baziRes.statusText}`);
        }

        const baziData = await baziRes.json();
        const recordId = baziData.recordId;
        console.log(`=> Lập lá số thành công! Record ID: ${recordId}\n`);

        // Step 3: Gọi API Luận giải AI (SSE Stream)
        console.log("3. Gọi API Luận giải AI (SSE Stream)...");
        const interpretRes = await fetch(`${BASE_URL}/ai/bazi/${recordId}/interpret`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
        });

        if (!interpretRes.ok) {
            const err = await interpretRes.json().catch(() => ({}));
            throw new Error(`Luận giải thất bại: ${err.error || interpretRes.statusText}`);
        }

        console.log("=> Bắt đầu nhận stream dữ liệu từ AI:");
        const reader = interpretRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let charCount = 0;
        let firstLines = "";

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                const chunk = decoder.decode(value, { stream: !done });
                charCount += chunk.length;
                if (firstLines.length < 1000) {
                    firstLines += chunk;
                }
            }
        }
        console.log("--- BẮT ĐẦU STREAM NHẬN ĐƯỢC ---");
        console.log(firstLines.substring(0, 800) + "...\n");
        console.log(`=> Tổng số ký tự nhận được từ AI stream: ${charCount}\n`);

        // Step 4: Gọi API Chat hỏi đáp AI (SSE Stream)
        console.log("4. Gọi API Chat hỏi đáp AI (Follow-up, SSE Stream)...");
        const chatRes = await fetch(`${BASE_URL}/ai/bazi/${recordId}/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                question: "Năm nay tôi có gặp hạn gì lớn về tiền bạc không thầy?",
                userId: userId
            })
        });

        if (!chatRes.ok) {
            const err = await chatRes.json().catch(() => ({}));
            throw new Error(`Chat thất bại: ${err.error || chatRes.statusText}`);
        }

        console.log("=> Bắt đầu nhận chat stream từ AI:");
        const chatReader = chatRes.body.getReader();
        const chatDecoder = new TextDecoder('utf-8');
        let chatDone = false;
        let chatText = "";

        while (!chatDone) {
            const { value, done: doneReading } = await chatReader.read();
            chatDone = doneReading;
            if (value) {
                const chunk = chatDecoder.decode(value, { stream: !chatDone });
                chatText += chunk;
            }
        }
        console.log("--- BẮT ĐẦU CHAT STREAM NHẬN ĐƯỢC ---");
        console.log(chatText.substring(0, 800) + "...\n");

        console.log("=== KIỂM THỬ TÍCH HỢP AI HOÀN TẤT THÀNH CÔNG 100% ===");

    } catch (e) {
        console.error("❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ:", e.message);
    }
}

runTest();

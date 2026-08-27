const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const API_BASE = 'http://localhost:3001/api';

const marriageDataset = [
    {
        name: 'Barack Obama & Michelle Obama',
        desc: 'Hôn nhân bền vững kiểu Song Mã Cùng Tiến (Power Couple), cùng bước lên đỉnh cao Nhà Trắng',
        male: { date: '04/08/1961', time: '19:24' },
        female: { date: '17/01/1964', time: '04:57' }
    },
    {
        name: 'Bill Gates & Melinda French Gates',
        desc: 'Đồng cam cộng khổ 27 năm xây dựng Microsoft và Quỹ từ thiện, ly hôn chia tài sản năm 2021',
        male: { date: '28/10/1955', time: '21:07' },
        female: { date: '15/08/1964', time: '02:00' }
    },
    {
        name: 'King Charles & Princess Diana',
        desc: 'Hôn nhân hoàng gia bi kịch, không có sự thấu hiểu, ngoại tình và ly hôn sóng gió',
        male: { date: '14/11/1948', time: '21:14' },
        female: { date: '01/07/1961', time: '19:45' }
    },
    {
        name: 'Lương Triều Vỹ & Lưu Gia Linh',
        desc: 'Cặp đôi showbiz bền vững hơn 30 năm, tính cách trái ngược (hướng nội vs hướng ngoại), không con cái, tri kỷ tự do',
        male: { date: '27/06/1962', time: '08:30' },
        female: { date: '08/12/1965', time: '18:30' }
    },
    {
        name: 'Brad Pitt & Angelina Jolie',
        desc: 'Cặp đôi bùng nổ đam mê (Brangelina), nhưng Tứ trụ xung khắc dẫn đến tranh chấp pháp lý và con cái dữ dội kéo dài',
        male: { date: '18/12/1963', time: '06:31' },
        female: { date: '04/06/1975', time: '09:09' }
    }
];

async function runMarriageBlackBox() {
    console.log('================================================================');
    console.log('🚀 BẮT ĐẦU BLACK BOX TESTING PROMPT HỢP HÔN (MARRIAGE) MỚI');
    console.log('================================================================\n');

    let token = '';
    let user = null;

    try {
        console.log('1. Đăng nhập tài khoản: cobatuoc@gmail.com ...');
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cobatuoc@gmail.com',
                password: '12345678'
            })
        });

        if (!loginRes.ok) {
            const errBody = await loginRes.json();
            throw new Error(errBody.error || `HTTP ${loginRes.status}`);
        }

        const loginData = await loginRes.json();
        token = loginData.token;
        user = loginData.user;
        console.log(`✅ Đăng nhập thành công! User ID: ${user._id}, Credits: ${user.credits}\n`);
    } catch (err) {
        console.error('❌ Lỗi đăng nhập:', err.message);
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const results = [];

    for (let i = 0; i < marriageDataset.length; i++) {
        const item = marriageDataset[i];
        console.log(`----------------------------------------------------------------`);
        console.log(`[${i + 1}/${marriageDataset.length}] Hợp Hôn Black Box: ${item.name}`);
        console.log(`      Bối cảnh thực tế: ${item.desc}`);

        try {
            // Step 1: POST /api/marriage/analyze
            const analyzeRes = await fetch(`${API_BASE}/marriage/analyze`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId: user._id,
                    male: item.male,
                    female: item.female,
                    dayBoundaryMode: 'midnight'
                })
            });

            if (!analyzeRes.ok) {
                const errBody = await analyzeRes.json();
                throw new Error(errBody.error || `HTTP ${analyzeRes.status}`);
            }

            const analyzeData = await analyzeRes.json();
            const recordId = analyzeData.recordId;
            console.log(`  -> Lập lá số Hợp Hôn thành công: Record ID = ${recordId}`);

            // Step 2: POST /api/ai/marriage/:id/interpret (SSE Stream)
            console.log(`  -> Kết nối SSE Stream gọi Gemini AI luận giải Hợp Hôn...`);
            
            let accumulatedText = '';
            
            const streamRes = await fetch(`${API_BASE}/ai/marriage/${recordId}/interpret`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/event-stream'
                }
            });

            if (!streamRes.ok) {
                const errText = await streamRes.text();
                throw new Error(`Stream error HTTP ${streamRes.status}: ${errText}`);
            }

            const reader = streamRes.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    const chunkStr = decoder.decode(value, { stream: true });
                    const lines = chunkStr.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataContent = line.slice(6).trim();
                            if (dataContent === '[DONE]') {
                                done = true;
                                break;
                            } else {
                                try {
                                    const parsed = JSON.parse(dataContent);
                                    if (parsed.chunk) accumulatedText += parsed.chunk;
                                    else if (parsed.text) accumulatedText += parsed.text;
                                    else if (parsed.content) accumulatedText += parsed.content;
                                } catch (e) {
                                    accumulatedText += dataContent;
                                }
                            }
                        }
                    }
                }
            }

            console.log(`  -> ✅ Nhận xong Luận giải Hợp Hôn (${accumulatedText.length} ký tự).`);

            results.push({
                index: i + 1,
                name: item.name,
                desc: item.desc,
                recordId,
                textLength: accumulatedText.length,
                content: accumulatedText
            });

        } catch (subErr) {
            console.error(`  ❌ Lỗi xử lý ${item.name}:`, subErr.message);
        }
    }

    const reportPath = path.join(__dirname, '../../marriage_blackbox_results.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\n================================================================`);
    console.log(`✅ ĐÃ HOÀN THÀNH VÀ LƯU KẾT QUẢ HỢP HÔN TẠI: ${reportPath}`);
    console.log(`================================================================`);
}

runMarriageBlackBox();

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const API_BASE = 'http://localhost:3001/api';

const testDataset = [
    { name: 'Mike Tyson', date: '30/06/1966', time: '02:40', gender: 1, desc: 'Võ sĩ bạo lực, tù tội, phá sản 400M USD, làm lại cuộc đời' },
    { name: 'Marilyn Monroe', date: '01/06/1926', time: '09:30', gender: 0, desc: 'Mồ côi, trầm cảm, 3 lần ly hôn, mất sớm tuổi 36' },
    { name: 'Trương Quốc Vinh (Leslie Cheung)', date: '12/09/1956', time: '16:30', gender: 1, desc: 'Nghệ sĩ thiên tài, trầm cảm nặng, tự sát tuổi 46 năm 2003' },
    { name: 'Bruce Lee (Lý Tiểu Long)', date: '27/11/1940', time: '07:12', gender: 1, desc: 'Huyền thoại võ thuật, đột tử năm 32 tuổi vì phù não' },
    { name: 'Princess Diana', date: '01/07/1961', time: '19:45', gender: 0, desc: 'Hôn nhân hoàng gia bi kịch, tai nạn xe qua đời tuổi 36 năm 1997' },
    { name: 'Đặng Lệ Quân (Teresa Teng)', date: '29/01/1953', time: '06:15', gender: 0, desc: 'Danh ca độc thân, mất năm 42 tuổi vì hen suyễn' },
    { name: 'Trịnh Công Sơn', date: '28/02/1939', time: '15:30', gender: 1, desc: 'Nhạc sĩ độc thân trọn đời, qua đời năm 2001 vì bệnh gan' },
    { name: 'Jack Ma (Mã Vân)', date: '10/09/1964', time: '09:15', gender: 1, desc: 'Khởi nghiệp đại tài, vấp ngã chính sách lớn năm 2020' },
    { name: 'Elon Musk', date: '28/06/1971', time: '07:30', gender: 1, desc: 'Tỷ phú công nghệ liều lĩnh, 3 lần ly hôn, 11 người con' },
    { name: 'Châu Nhuận Phát (Chow Yun-fat)', date: '18/05/1955', time: '06:15', gender: 1, desc: 'Tài tử màn ảnh, không con cái, hiến 700M USD làm từ thiện' }
];

async function runBlackBoxTest() {
    console.log('================================================================');
    console.log('🚀 BẮT ĐẦU BLACK BOX TESTING PROMPT MỚI VỚI 10 CUỘC ĐỜI ĐA DẠNG');
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

    const fullOutputs = [];

    for (let i = 0; i < testDataset.length; i++) {
        const item = testDataset[i];
        console.log(`----------------------------------------------------------------`);
        console.log(`[${i + 1}/10] Black Box Testing: ${item.name} (${item.date} ${item.time})`);
        console.log(`      Bối cảnh: ${item.desc}`);

        try {
            // Step 1: POST /api/bazi/analyze
            const analyzeRes = await fetch(`${API_BASE}/bazi/analyze`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId: user._id,
                    name: item.name,
                    date: item.date,
                    time: item.time,
                    gender: item.gender,
                    calendarMode: 'solar'
                })
            });

            if (!analyzeRes.ok) {
                const errBody = await analyzeRes.json();
                throw new Error(errBody.error || `HTTP ${analyzeRes.status}`);
            }

            const analyzeData = await analyzeRes.json();
            const recordId = analyzeData.recordId || analyzeData.record?._id || analyzeData._id;
            const canChi = analyzeData.canChi;
            
            console.log(`  -> Lập lá số thành công: Record ID = ${recordId}`);
            console.log(`  -> Tứ Trụ: ${canChi?.year?.canChi} | ${canChi?.month?.canChi} | ${canChi?.day?.canChi} | ${canChi?.hour?.canChi}`);

            // Step 2: POST /api/ai/bazi/:id/interpret (SSE Stream)
            console.log(`  -> Kết nối SSE Stream gọi Gemini AI sinh luận giải theo Prompt mới...`);
            
            let accumulatedText = '';
            
            const streamRes = await fetch(`${API_BASE}/ai/bazi/${recordId}/interpret`, {
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

            console.log(`  -> ✅ Nhận xong Luận giải AI (${accumulatedText.length} ký tự).`);

            // Kiểm tra format 3 bước ngoặt
            const hasTurningPoint1 = /Bước ngoặt 1/i.test(accumulatedText);
            const hasTurningPoint2 = /Bước ngoặt 2/i.test(accumulatedText);
            const hasTurningPoint3 = /Bước ngoặt 3/i.test(accumulatedText);
            const hasExplicit3Points = hasTurningPoint1 && hasTurningPoint2 && hasTurningPoint3;

            // Kiểm tra phân nhánh thân nhược
            const hasThânNhượcBiệnChứng = /thân nhược đắc cứu|thân nhược vô cứu|đòn bẩy|sát ấn tương sinh|thực thần chế sát/i.test(accumulatedText);

            // Kiểm tra hôn nhân đa chiều
            const hasMarriageModel = /độc thân|đa hôn|tận hiến|đồng hành|rạn nứt|hòa thuận|phối ngẫu/i.test(accumulatedText);

            // Kiểm tra điểm gãy sinh mệnh / tật ách
            const hasDeathNodeOrHealth = /điểm gãy sinh mệnh|đại hạn|sinh tử|mốc tuổi|tật ách|tạng phủ/i.test(accumulatedText);

            fullOutputs.push({
                index: i + 1,
                name: item.name,
                desc: item.desc,
                recordId,
                canChi: `${canChi?.year?.canChi} | ${canChi?.month?.canChi} | ${canChi?.day?.canChi} | ${canChi?.hour?.canChi}`,
                textLength: accumulatedText.length,
                evalChecks: {
                    hasExplicit3Points,
                    hasThânNhượcBiệnChứng,
                    hasMarriageModel,
                    hasDeathNodeOrHealth
                },
                content: accumulatedText
            });

            console.log(`  -> Kiểm tra: 3 Bước Ngoặt = ${hasExplicit3Points ? '✅ ĐẠT' : '⚠️ CHƯA'}, Biện Chứng Thân Nhược = ${hasThânNhượcBiệnChứng ? '✅' : '⚠️'}, Mô Hình Hôn Nhân = ${hasMarriageModel ? '✅' : '⚠️'}, Điểm Gãy/Tật Ách = ${hasDeathNodeOrHealth ? '✅' : '⚠️'}`);

        } catch (subErr) {
            console.error(`  ❌ Lỗi xử lý ${item.name}:`, subErr.message);
        }
    }

    // Save full raw output to json
    const reportPath = path.join(__dirname, '../../blackbox_results_strict.json');
    fs.writeFileSync(reportPath, JSON.stringify(fullOutputs, null, 2), 'utf8');
    console.log(`\n================================================================`);
    console.log(`✅ ĐÃ HOÀN THÀNH VÀ LƯU KẾT QUẢ BLACK BOX NGHIÊM KHẮC TẠI: ${reportPath}`);
    console.log(`================================================================`);
}

runBlackBoxTest();

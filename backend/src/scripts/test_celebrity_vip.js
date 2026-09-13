const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const BaziAnalyzer = require('../modules/bazi/services/BaziAnalyzer');
const BaziPrompts = require('../modules/bazi/services/BaziPrompts');
const MultiAgentPipelineService = require('../core/services/MultiAgentPipelineService');
const BaziRecord = require('../modules/bazi/models/BaziRecord');
const User = require('../core/models/User');

const CELEBRITIES = [
  {
    name: 'Bill Gates',
    gender: 1, // Nam
    date: '28/10/1955',
    time: '21:30',
    description: 'Nhâm Thủy sinh tháng Tuất, giờ Tân Hợi - Nhà sáng lập Microsoft & Tỷ phú Từ thiện'
  },
  {
    name: 'Steve Jobs',
    gender: 1, // Nam
    date: '24/02/1955',
    time: '19:15',
    description: 'Bính Thìn sinh tháng Mậu Dần, giờ Mậu Tuất - Nhà sáng lập Apple & Huyền thoại Thiết kế'
  }
];

async function run() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PIPELINE 3 TẦNG VỚI GEMINI TỔNG BIÊN TẬP TRÊN LÁ SỐ NGƯỜI NỔI TIẾNG ---');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected successfully.');

  const adminUser = await User.findOne({ email: 'cobatuoc@gmail.com' });
  const userId = adminUser ? adminUser._id : 'guest';

  for (const celeb of CELEBRITIES) {
    console.log(`\n================================================================`);
    console.log(`🚀 [KIỂM THỬ] Khởi tạo lá số cho: ${celeb.name} (${celeb.date} ${celeb.time})`);
    console.log(`Mô tả: ${celeb.description}`);
    console.log(`================================================================`);

    // 1. Phân tích Bát Tự
    const baziData = BaziAnalyzer.analyze(celeb.date, celeb.time, celeb.gender, 'midnight');
    
    // 2. Tìm hoặc tạo bản ghi BaziRecord
    let record = await BaziRecord.findOne({
      'inputInfo.name': celeb.name,
      'inputInfo.date': celeb.date,
      'inputInfo.time': celeb.time
    });

    if (!record) {
      record = new BaziRecord({
        userId,
        inputInfo: {
          name: celeb.name,
          gender: celeb.gender,
          date: celeb.date,
          time: celeb.time,
          calendarMode: 'solar',
          dayBoundaryMode: 'midnight'
        },
        solarTimeline: baziData.solarTimeline || 'Dương lịch chuẩn',
        tietKhiTimeline: baziData.tietKhiTimeline,
        baziData,
        isPublic: true
      });
      await record.save();
      console.log(`Đã tạo mới BaziRecord ID: ${record._id}`);
    } else {
      record.baziData = baziData;
      record.isPublic = true;
      await record.save();
      console.log(`Đã cập nhật BaziRecord ID có sẵn: ${record._id}`);
    }

    // 3. Tạo Prompt Deep Prompt
    const prompt = BaziPrompts.getDeepPrompt(record.toObject());
    const birthYear = celeb.date.split('/')[2];

    console.log(`Bắt đầu chạy MultiAgent VIP Pipeline (Qwen Plus + Gemini Flash Lite + Gemini Chief Editor)...`);
    const startTime = Date.now();
    let accumulatedText = '';

    const vipResult = await MultiAgentPipelineService.runVipPipelineStream(prompt, birthYear, {
      onProgress: (p) => {
        if (p.stage === 'stage1') console.log(`  [Tầng 1]: ${p.message}`);
        else if (p.stage === 'stage2' && p.status === 'completed') console.log(`  [Tầng 2]: ${p.message}`);
        else if (p.stage === 'stage3') console.log(`  [Tầng 3]: ${p.message}`);
      }
    });

    for await (const chunk of vipResult.stream) {
      const chunkText = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
      accumulatedText += chunkText;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n Hoàn thành toàn trình VIP cho ${celeb.name} trong ${elapsed} giây!`);
    console.log(`Tổng dung lượng sinh ra: ${accumulatedText.length} ký tự (~${(accumulatedText.length / 5).toFixed(0)} từ).`);

    // 4. Lưu kết quả vào DB
    record.aiInterpretation = {
      content: accumulatedText,
      mode: 'vip',
      generatedAt: new Date(),
      model: 'Multi-Agent VIP Pipeline (Qwen Plus + Gemini 3.1 Flash Lite - Chief Editor)',
      promptVersion: '4.0.0',
      tokensUsed: Math.ceil(accumulatedText.length / 4)
    };
    record.isGeneratingInterpretation = false;
    await record.save();
    console.log(`Đã lưu luận giải vào Database cho ID: ${record._id}`);

    // 5. Kiểm tra tính hiện diện của các khối học thuật mấu chốt
    console.log('\n--- BÁO CÁO KIỂM THẨM ĐỊNH HỌC THUẬT ---');
    console.log(`1. Có Mục Dẫn Nhập SWOT (Tầng 3):`, accumulatedText.includes('ĐỊNH VỊ BẢN MỆNH') && accumulatedText.includes('SWOT'));
    console.log(`2. Có Chương 1 (Sự nghiệp):`, accumulatedText.includes('CHƯƠNG 1'));
    console.log(`3. Có Chương 2 (Tài chính):`, accumulatedText.includes('CHƯƠNG 2'));
    console.log(`4. Có Chương 3 (Hôn nhân):`, accumulatedText.includes('CHƯƠNG 3'));
    console.log(`5. Có Chương 4 (Sức khỏe):`, accumulatedText.includes('CHƯƠNG 4'));
    console.log(`6. Có Chương 5 (Phong thủy):`, accumulatedText.includes('CHƯƠNG 5'));
    console.log(`7. Có Chương 6 (Đại vận):`, accumulatedText.includes('CHƯƠNG 6'));
    console.log(`8. Có Mục CHIẾN LƯỢC ĐIỀU HÒA ĐA MỤC TIÊU (Tầng 3 Chief Editor):`, accumulatedText.includes('CHIẾN LƯỢC ĐIỀU HÒA ĐA MỤC TIÊU'));
    console.log(`9. Có Mục ĐÚC KẾT NHÂN SINH (Tầng 3):`, accumulatedText.includes('ĐÚC KẾT NHÂN SINH'));
    console.log(`10. Không có sao Tử Vi ngoại lai (Đà La, Kình Dương, Không Kiếp):`, !accumulatedText.includes('Đà La') && !accumulatedText.includes('Kình Dương'));
  }

  console.log('\nToàn bộ quá trình kiểm thử hoàn tất!');
  process.exit(0);
}

run().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});

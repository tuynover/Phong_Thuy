const fs = require('fs');
const path = require('path');
const BaziAnalyzer = require('../services/BaziAnalyzer');

const figures = [
  { id: 1, country: 'Pháp (Châu Âu)', name: 'Napoléon Bonaparte', role: 'Hoàng đế Pháp, Thiên tài quân sự', date: '15/08/1769', time: '11:30', gender: 1 },
  { id: 2, country: 'Ý (Châu Âu)', name: 'Leonardo da Vinci', role: 'Đại danh họa & Bách khoa toàn thư Phục hưng', date: '15/04/1452', time: '21:40', gender: 1 },
  { id: 3, country: 'Anh (Châu Âu)', name: 'Isaac Newton', role: 'Nhà vật lý, toán học vĩ đại', date: '04/01/1643', time: '01:00', gender: 1 },
  { id: 4, country: 'Anh (Châu Âu)', name: 'Winston Churchill', role: 'Thủ tướng Anh thời Thế chiến II', date: '30/11/1874', time: '01:30', gender: 1 },
  { id: 5, country: 'Nam Phi (Châu Phi)', name: 'Nelson Mandela', role: 'Lãnh tụ chống Apartheid, Nobel Hòa Bình', date: '18/07/1918', time: '14:00', gender: 1 },
  { id: 6, country: 'Ấn Độ (Châu Á)', name: 'Mahatma Gandhi', role: 'Lãnh tụ phong trào Bất bạo động', date: '02/10/1869', time: '07:11', gender: 1 },
  { id: 7, country: 'Mỹ (Châu Mỹ)', name: 'Barack Obama', role: 'Tổng thống Mỹ thứ 44', date: '04/08/1961', time: '19:24', gender: 1 },
  { id: 8, country: 'Mỹ (Châu Mỹ)', name: 'Warren Buffett', role: 'Huyền thoại đầu tư thế giới', date: '30/08/1930', time: '15:00', gender: 1 },
  { id: 9, country: 'Mỹ (Châu Mỹ)', name: 'Walt Disney', role: 'Nhà sáng lập đế chế hoạt hình Disney', date: '05/12/1901', time: '00:35', gender: 1 },
  { id: 10, country: 'Nhật Bản (Châu Á)', name: 'Hayao Miyazaki', role: 'Đạo diễn huyền thoại Studio Ghibli', date: '05/01/1941', time: '04:30', gender: 1 },
  { id: 11, country: 'Nhật Bản (Châu Á)', name: 'Akira Kurosawa', role: 'Đạo diễn điện ảnh vĩ đại nhất châu Á', date: '23/03/1910', time: '06:00', gender: 1 },
  { id: 12, country: 'Hàn Quốc (Châu Á)', name: 'Bong Joon-ho', role: 'Đạo diễn đoạt Oscar phim Parasite', date: '14/09/1969', time: '10:00', gender: 1 },
  { id: 13, country: 'Việt Nam (Châu Á)', name: 'Đại tướng Võ Nguyên Giáp', role: 'Đại tướng Tổng tư lệnh QĐNDVN', date: '25/08/1911', time: '06:00', gender: 1 },
  { id: 14, country: 'Việt Nam (Châu Á)', name: 'Phan Chu Trinh', role: 'Nhà cải cách, chí sĩ yêu nước', date: '09/09/1872', time: '10:00', gender: 1 },
  { id: 15, country: 'Mỹ (Châu Mỹ)', name: 'Mark Zuckerberg', role: 'Nhà sáng lập Facebook / Meta', date: '14/05/1984', time: '14:39', gender: 1 },
  { id: 16, country: 'Mỹ (Châu Mỹ)', name: 'Jeff Bezos', role: 'Nhà sáng lập tập đoàn Amazon', date: '12/01/1964', time: '10:30', gender: 1 },
  { id: 17, country: 'Đức (Châu Âu)', name: 'Ludwig van Beethoven', role: 'Nhà soạn nhạc thiên tài thế giới', date: '16/12/1770', time: '16:00', gender: 1 },
  { id: 18, country: 'Áo (Châu Âu)', name: 'Wolfgang Amadeus Mozart', role: 'Thần đồng & thiên tài âm nhạc cổ điển', date: '27/01/1756', time: '20:00', gender: 1 },
  { id: 19, country: 'Brazil (Châu Mỹ)', name: 'Pelé', role: 'Vua bóng đá thế giới (3 lần vô địch World Cup)', date: '23/10/1940', time: '03:00', gender: 1 },
  { id: 20, country: 'Mỹ / Hong Kong', name: 'Bruce Lee (Lý Tiểu Long)', role: 'Huyền thoại võ thuật & điện ảnh thế giới', date: '27/11/1940', time: '07:12', gender: 1 }
];

console.log('========================================================================');
console.log('BENCHMARK 20 NHÂN VẬT LỊCH SỬ THẾ GIỚI - BÁT TỰ & TỨ TRỤ HỌC THUẬT');
console.log('========================================================================\n');

const summaryList = [];

figures.forEach(fig => {
  try {
    const res = BaziAnalyzer.analyze(fig.date, fig.time, fig.gender);
    const cc = res.canChi;
    const pYear = cc ? `${cc.year.gan} ${cc.year.zhi}` : 'N/A';
    const pMonth = cc ? `${cc.month.gan} ${cc.month.zhi}` : 'N/A';
    const pDay = cc ? `${cc.day.gan} ${cc.day.zhi}` : 'N/A';
    const pHour = cc ? `${cc.hour.gan} ${cc.hour.zhi}` : 'N/A';
    
    const analysis = res.analysis || {};
    const than = analysis.thanDegree || analysis.than || 'N/A';
    const cachCuc = analysis.cachCuc || 'N/A';
    const dungThan = analysis.dungThan || 'N/A';
    const hyThan = analysis.hyThan || 'N/A';
    const scores = res.nguHanhScores || res.scores || {};
    const relations = analysis.relations || {};

    const itemResult = {
      id: fig.id,
      name: fig.name,
      country: fig.country,
      role: fig.role,
      date: fig.date,
      time: fig.time,
      tuTru: `${pYear} | ${pMonth} | ${pDay} | ${pHour}`,
      nhatChu: cc ? `${cc.day.gan} (${cc.day.element || 'N/A'})` : 'N/A',
      than,
      cachCuc,
      dungThan,
      hyThan,
      nguHanh: scores,
      relations: {
        xung: relations.lucXung || [],
        hop: relations.lucHop || [],
        tamHop: relations.tamHop || [],
        hinh: relations.tuongHinh || []
      }
    };

    summaryList.push(itemResult);

    console.log(`[#${fig.id}] ${fig.name} - ${fig.country}`);
    console.log(`    Tiểu sử/Vai trò: ${fig.role}`);
    console.log(`    Sinh ngày: ${fig.date} ${fig.time}`);
    console.log(`    Tứ Trụ: Năm [${pYear}] - Tháng [${pMonth}] - Ngày [${pDay}] - Giờ [${pHour}]`);
    console.log(`    Nhật Chủ: ${itemResult.nhatChu} | Vượng Suy: ${than} | Cách Cục: ${cachCuc}`);
    console.log(`    Dụng Thần: ${dungThan} | Hỷ Thần: ${hyThan}`);
    console.log(`    Tương tác Chi: Xung: ${relations.lucXung?.join(', ') || 'Không'} | Hợp: ${relations.lucHop?.join(', ') || 'Không'} | Tam Hợp: ${relations.tamHop?.join(', ') || 'Không'}`);
    console.log('------------------------------------------------------------------------\n');
  } catch (err) {
    console.error(`[#${fig.id}] Error with ${fig.name}:`, err.message);
  }
});

const outputPath = path.join(__dirname, 'test_20_figures_world_results.json');
fs.writeFileSync(outputPath, JSON.stringify(summaryList, null, 2), 'utf8');
console.log(`\nHoàn tất phân tích 20 nhân vật! Đã lưu kết quả vào ${outputPath}`);
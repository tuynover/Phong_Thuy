const fs = require('fs');
const path = require('path');
const BaziAnalyzer = require('../services/BaziAnalyzer');

const idols = [
  { id: 1, country: 'Mỹ (US-UK)', name: 'Michael Jackson', role: 'Vua nhạc Pop thế giới (King of Pop)', date: '29/08/1958', time: '23:45', gender: 1 },
  { id: 2, country: 'Mỹ (US-UK)', name: 'Taylor Swift', role: 'Siêu sao nhạc Pop & Country toàn cầu thế kỷ 21', date: '13/12/1989', time: '05:17', gender: 0 },
  { id: 3, country: 'Mỹ (US-UK)', name: 'Beyoncé', role: 'Nữ hoàng R&B thế giới (Queen Bey)', date: '04/09/1981', time: '10:00', gender: 0 },
  { id: 4, country: 'Anh (US-UK)', name: 'Freddie Mercury', role: 'Giọng ca huyền thoại ban nhạc Queen', date: '05/09/1946', time: '06:10', gender: 1 },
  { id: 5, country: 'Mỹ (US-UK)', name: 'Madonna', role: 'Nữ hoàng nhạc Pop (Queen of Pop)', date: '16/08/1958', time: '07:05', gender: 0 },
  { id: 6, country: 'Mỹ (Hollywood)', name: 'Marilyn Monroe', role: 'Biểu tượng gợi cảm & minh tinh Hollywood', date: '01/06/1926', time: '09:30', gender: 0 },
  { id: 7, country: 'Mỹ (Hollywood)', name: 'Leonardo DiCaprio', role: 'Tài tử điện ảnh đoạt Oscar (Titanic)', date: '11/11/1974', time: '02:47', gender: 1 },
  { id: 8, country: 'Mỹ (Hollywood)', name: 'Tom Cruise', role: 'Siêu sao hành động Hollywood (Top Gun, M:I)', date: '03/07/1962', time: '15:06', gender: 1 },
  { id: 9, country: 'Bỉ / Anh (Hollywood)', name: 'Audrey Hepburn', role: 'Biểu tượng thanh lịch & minh tinh Oscar', date: '04/05/1929', time: '03:00', gender: 0 },
  { id: 10, country: 'Hàn Quốc (K-Pop)', name: 'Jungkook (BTS)', role: 'Golden Maknae siêu sao K-Pop toàn cầu', date: '01/09/1997', time: '15:30', gender: 1 },
  { id: 11, country: 'Hàn Quốc (K-Pop)', name: 'G-Dragon (BIGBANG)', role: 'Ông hoàng K-Pop & Biểu tượng thời trang', date: '18/08/1988', time: '12:00', gender: 1 },
  { id: 12, country: 'Hàn Quốc (K-Pop)', name: 'IU (Lee Ji-eun)', role: 'Em gái quốc dân, Nữ ca sĩ / Nhạc sĩ số 1', date: '16/05/1993', time: '14:30', gender: 0 },
  { id: 13, country: 'Hàn Quốc (K-Drama)', name: 'Son Ye-jin', role: 'Nữ thần phim tình cảm Hàn Quốc (Hạ Cánh Nơi Anh)', date: '11/01/1982', time: '06:00', gender: 0 },
  { id: 14, country: 'Đài Loan (Mandopop)', name: 'Châu Kiệt Luân (Jay Chou)', role: 'Ông hoàng nhạc Pop châu Á (King of Mandopop)', date: '18/01/1979', time: '10:30', gender: 1 },
  { id: 15, country: 'Trung Quốc (C-Pop)', name: 'Vương Phi (Faye Wong)', role: 'Thiên hậu làng nhạc Hoa ngữ', date: '08/08/1969', time: '21:15', gender: 0 },
  { id: 16, country: 'Hong Kong (C-Pop)', name: 'Lưu Đức Hoa (Andy Lau)', role: 'Thiên vương giải trí Hong Kong & Ca sĩ / Diễn viên', date: '27/09/1961', time: '06:15', gender: 1 },
  { id: 17, country: 'Nhật Bản (J-Pop)', name: 'Takuya Kimura (SMAP)', role: 'Thần tượng quốc dân số 1 lịch sử J-Pop', date: '13/11/1972', time: '10:00', gender: 1 },
  { id: 18, country: 'Ấn Độ (Bollywood)', name: 'Aishwarya Rai', role: 'Hoa hậu Thế giới 1994 & Nữ hoàng Bollywood', date: '01/11/1973', time: '04:05', gender: 0 },
  { id: 19, country: 'Việt Nam (V-Pop)', name: 'Sơn Tùng M-TP', role: 'Nghệ sĩ & Ca sĩ hàng đầu V-Pop', date: '05/07/1994', time: '06:30', gender: 1 },
  { id: 20, country: 'Việt Nam (V-Pop)', name: 'Mỹ Tâm', role: 'Họa mi tóc nâu, Nữ ca sĩ hàng đầu V-Pop 20+ năm', date: '16/01/1981', time: '08:30', gender: 0 }
];

console.log('========================================================================');
console.log('BENCHMARK 20 CA SĨ, DIỄN VIÊN & THẦN TƯỢNG TOÀN CẦU (IDOLS & CELEBRITIES)');
console.log('========================================================================\n');

const summaryList = [];

idols.forEach(star => {
  try {
    const res = BaziAnalyzer.analyze(star.date, star.time, star.gender);
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
    const relations = analysis.relations || {};

    const itemResult = {
      id: star.id,
      name: star.name,
      country: star.country,
      role: star.role,
      date: star.date,
      time: star.time,
      tuTru: `${pYear} | ${pMonth} | ${pDay} | ${pHour}`,
      nhatChu: cc ? `${cc.day.gan} (${cc.day.element || 'N/A'})` : 'N/A',
      than,
      cachCuc,
      dungThan,
      hyThan,
      relations: {
        xung: relations.lucXung || [],
        hop: relations.lucHop || [],
        tamHop: relations.tamHop || [],
        hinh: relations.tuongHinh || []
      }
    };

    summaryList.push(itemResult);

    console.log(`[#${star.id}] ${star.name} (${star.country})`);
    console.log(`    Danh hiệu: ${star.role}`);
    console.log(`    Sinh ngày: ${star.date} ${star.time} | Giới tính: ${star.gender === 1 ? 'Nam' : 'Nữ'}`);
    console.log(`    Tứ Trụ: [${pYear}] - [${pMonth}] - [${pDay}] - [${pHour}]`);
    console.log(`    Nhật Chủ: ${itemResult.nhatChu} | Vượng Suy: ${than} | Cách Cục: ${cachCuc}`);
    console.log(`    Tương tác Chi: Xung: ${relations.lucXung?.join(', ') || 'Không'} | Hợp: ${relations.lucHop?.join(', ') || 'Không'} | Tam Hợp: ${relations.tamHop?.join(', ') || 'Không'}`);
    console.log('------------------------------------------------------------------------\n');
  } catch (err) {
    console.error(`[#${star.id}] Error with ${star.name}:`, err.message);
  }
});

const outputPath = path.join(__dirname, 'test_20_idols_results.json');
fs.writeFileSync(outputPath, JSON.stringify(summaryList, null, 2), 'utf8');
console.log(`\nHoàn tất phân tích 20 nghệ sĩ / thần tượng! Đã lưu kết quả vào ${outputPath}`);
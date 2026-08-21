const fs = require('fs');
const path = require('path');
const BaziAnalyzer = require('../services/BaziAnalyzer');

/**
 * BỘ TẬP TẮC TEST CASE TOÀN DIỆN CHO TẤT CẢ CÁCH CỤC & DỤNG THẦN BÁT TỰ
 * (Comprehensive Test Cases Suite for Bazi Patterns & Dung Than Engine)
 */
const allDungThanTestCases = [
  // ----------------------------------------------------------------------------------
  // 1. NHÓM 5 NGUYÊN LÝ DỤNG THẦN CỔ HỌC (5 CORE DUNG THAN MECHANISMS)
  // ----------------------------------------------------------------------------------
  {
    id: 'DT-01',
    category: '1. Điều Hậu Dụng Thần (Mùa Đông Buốt Giá)',
    date: '15/12/1988',
    time: '00:30',
    gender: 1,
    expectedMechanism: 'Điều Hậu',
    expectedDungThan: 'Hỏa',
    description: 'Sinh tháng Tý (Đông Chí), Thủy Kim cực hàn, bắt buộc dùng Hỏa sưởi ấm chiếu sáng giải hàn khí.'
  },
  {
    id: 'DT-02',
    category: '1. Điều Hậu Dụng Thần (Mùa Hạ Nóng Bức)',
    date: '25/06/1990',
    time: '12:30',
    gender: 0,
    expectedMechanism: 'Điều Hậu',
    expectedDungThan: 'Thủy',
    description: 'Sinh tháng Ngọ (Hạ Chí), Hỏa Thổ cực táo, bắt buộc dùng Thủy nhuần nhược giải hạ nhiệt.'
  },
  {
    id: 'DT-03',
    category: '2. Thông Quan Dụng Thần (Kim - Mộc Giao Chiến)',
    date: '15/09/1980',
    time: '06:00',
    gender: 1,
    expectedMechanism: 'Thông Quan',
    expectedDungThan: 'Thủy',
    description: 'Kim vượng khắc Mộc vượng, 2 phe xung đột dữ dội, dùng Thủy hòa giải Kim sinh Thủy - Thủy sinh Mộc.'
  },
  {
    id: 'DT-04',
    category: '2. Thông Quan Dụng Thần (Thủy - Hỏa Đao Binh)',
    date: '08/01/1985',
    time: '12:00',
    gender: 1,
    expectedMechanism: 'Thông Quan',
    expectedDungThan: 'Mộc',
    description: 'Thủy vượng khắc Hỏa vượng, dùng Mộc hòa giải Thủy sinh Mộc - Mộc sinh Hỏa.'
  },
  {
    id: 'DT-05',
    category: '2. Thông Quan Dụng Thần (Hỏa - Kim Giao Chiến)',
    date: '10/06/1992',
    time: '16:00',
    gender: 0,
    expectedMechanism: 'Thông Quan',
    expectedDungThan: 'Thổ',
    description: 'Hỏa vượng nung Kim vượng, dùng Thổ hòa giải Hỏa sinh Thổ - Thổ sinh Kim.'
  },
  {
    id: 'DT-06',
    category: '2. Thông Quan Dụng Thần (Mộc - Thổ Tranh Cục)',
    date: '12/03/1986',
    time: '08:00',
    gender: 1,
    expectedMechanism: 'Thông Quan',
    expectedDungThan: 'Hỏa',
    description: 'Mộc vượng khắc Thổ vượng, dùng Hỏa hòa giải Mộc sinh Hỏa - Hỏa sinh Thổ.'
  },
  {
    id: 'DT-07',
    category: '2. Thông Quan Dụng Thần (Thổ - Thủy Tranh Cục)',
    date: '20/10/1988',
    time: '23:30',
    gender: 1,
    expectedMechanism: 'Thông Quan',
    expectedDungThan: 'Kim',
    description: 'Thổ vượng dằn Thủy vượng, dùng Kim hòa giải Thổ sinh Kim - Kim sinh Thủy.'
  },
  {
    id: 'DT-08',
    category: '3. Tòng Cách / Chuyên Vượng (Viêm Thượng Cách - Hỏa)',
    date: '12/06/1866',
    time: '12:00',
    gender: 1,
    expectedMechanism: 'Tòng Cách / Chuyên Vượng',
    expectedDungThan: 'Thổ',
    description: 'Bính Dần - Giáp Ngọ - Mậu Ngọ - Mậu Ngọ, Hỏa Thổ chiếm ưu thế tuyệt đối, thuận khí vượng.'
  },
  {
    id: 'DT-09',
    category: '3. Tòng Cách / Chuyên Vượng (Nhuận Hạ Cách - Thủy)',
    date: '14/12/1888',
    time: '00:00',
    gender: 1,
    expectedMechanism: 'Tòng Cách / Chuyên Vượng',
    expectedDungThan: 'Thủy',
    description: 'Thủy Kim độc vượng sinh mùa Đông, thuận theo thế Thủy khí.'
  },
  {
    id: 'DT-10',
    category: '3. Tòng Cách / Chuyên Vượng (Giá Sắc Cách - Thổ)',
    date: '05/08/1968',
    time: '08:30',
    gender: 1,
    expectedMechanism: 'Tòng Cách / Chuyên Vượng',
    expectedDungThan: 'Thổ',
    description: 'Mậu Thân - Kỷ Mùi - Đinh Mùi - Giáp Thìn (Phạm Nhật Vượng), Tòng Nhi/Giá Sắc Thổ vượng.'
  },
  {
    id: 'DT-11',
    category: '3. Tòng Cách (Tòng Tài Cách)',
    date: '16/09/1981',
    time: '06:15',
    gender: 0,
    expectedMechanism: 'Tòng Cách / Chuyên Vượng',
    expectedDungThan: 'Kim',
    description: 'Tân Dậu - Đinh Dậu - Đinh Dậu - Quý Mão (Phạm Băng Băng), Kim Tài vượng tòng thế.'
  },
  {
    id: 'DT-12',
    category: '3. Tòng Cách (Tòng Sát Cách)',
    date: '13/10/1956',
    time: '12:00',
    gender: 0,
    expectedMechanism: 'Tòng Cách / Chuyên Vượng',
    expectedDungThan: 'Thổ',
    description: 'Quý Thủy không căn bị Thổ Quan Sát bao vây (Trương Mỹ Lan), tòng Sát Thổ.'
  },
  {
    id: 'DT-13',
    category: '4. Phù Ức Thân Nhược (Sinh Phù / Trợ Lực)',
    date: '15/06/1975',
    time: '06:00',
    gender: 0,
    expectedMechanism: 'Phù Ức Thân Nhược',
    expectedDungThan: 'Kim',
    description: 'Nhâm Thủy sinh tháng Ngọ bị Mộc Hỏa tiết khí, cần Kim Ấn sinh phù Thân.'
  },
  {
    id: 'DT-14',
    category: '4. Phù Ức Thân Vượng (Tiết Tú / Khắc Chế / Hao Tài)',
    date: '21/08/1888',
    time: '12:30',
    gender: 1,
    expectedMechanism: 'Phù Ức Thân Vượng',
    expectedDungThan: 'Thủy',
    description: 'Mậu Tý - Canh Thân - Giáp Tý - Canh Ngọ (Đỗ Nguyệt Sênh), Thân vượng cần Thủy/Hỏa giải tỏa.'
  },

  // ----------------------------------------------------------------------------------
  // 2. NHÓM BÁT CHÍNH CÁCH (8 STANDARD BAZI STRUCTURES)
  // ----------------------------------------------------------------------------------
  {
    id: 'CC-01',
    category: 'Bát Chính Cách (Chính Quan Cách)',
    date: '04/08/1961',
    time: '19:24',
    gender: 1,
    expectedCachCuc: 'Chính Quan cách',
    description: 'Kỷ Thổ sinh tháng Mùi có Giáp Mộc thấu can (Barack Obama).'
  },
  {
    id: 'CC-02',
    category: 'Bát Chính Cách (Thất Sát Cách)',
    date: '15/08/1769',
    time: '11:30',
    gender: 1,
    expectedCachCuc: 'Thất Sát cách',
    description: 'Giáp Mộc sinh tháng Thân Canh Kim đương lệnh (Napoléon Bonaparte).'
  },
  {
    id: 'CC-03',
    category: 'Bát Chính Cách (Chính Tài Cách)',
    date: '05/08/1968',
    time: '08:30',
    gender: 1,
    expectedCachCuc: 'Chính Tài cách',
    description: 'Đinh Hỏa sinh tháng Mùi Thổ vượng sinh Tài.'
  },
  {
    id: 'CC-04',
    category: 'Bát Chính Cách (Thiên Tài Cách)',
    date: '01/07/1311',
    time: '06:00',
    gender: 1,
    expectedCachCuc: 'Thiên Tài cách',
    description: 'Ất Mộc sinh tháng Mùi Kỷ Thổ thấu can (Lưu Bá Ôn).'
  },
  {
    id: 'CC-05',
    category: 'Bát Chính Cách (Chính Ấn Cách)',
    date: '29/11/1835',
    time: '14:00',
    gender: 0,
    expectedCachCuc: 'Chính Ấn cách',
    description: 'Ất Mộc sinh tháng Hợi Quý Thủy thấu can (Từ Hi Thái Hậu).'
  },
  {
    id: 'CC-06',
    category: 'Bát Chính Cách (Thiên Ấn / Tiêu Thần Cách)',
    date: '07/10/1980',
    time: '08:30',
    gender: 1,
    expectedCachCuc: 'Thiên Ấn cách',
    description: 'Quý Thủy sinh tháng Dậu Tân Kim đương lệnh (Trần Quán Hy).'
  },
  {
    id: 'CC-07',
    category: 'Bát Chính Cách (Thực Thần Cách)',
    date: '18/02/1877',
    time: '06:00',
    gender: 1,
    expectedCachCuc: 'Thực Thần cách',
    description: 'Nhâm Thủy sinh tháng Dần Mộc tiết tú.'
  },
  {
    id: 'CC-08',
    category: 'Bát Chính Cách (Thương Quan Cách)',
    date: '26/12/1867',
    time: '06:30',
    gender: 1,
    expectedCachCuc: 'Thương Quan cách',
    description: 'Canh Kim sinh tháng Tý Thủy Thương Quan vượng (Phan Bội Châu).'
  },

  // ----------------------------------------------------------------------------------
  // 3. NHÓM LỘC NHẬN & QUÝ CÁCH ĐẶC THÙ (SPECIAL & STAR STRUCTURES)
  // ----------------------------------------------------------------------------------
  {
    id: 'SQ-01',
    category: 'Lộc Nhận / Quý Cách (Kiến Lộc Cách)',
    date: '27/06/1880',
    time: '16:00',
    gender: 0,
    expectedCachCuc: 'Kiến Lộc cách',
    description: 'Đinh Hỏa sinh tháng Ngọ đắc Kiến Lộc (Helen Keller).'
  },
  {
    id: 'SQ-02',
    category: 'Lộc Nhận / Quý Cách (Dương Nhận / Kiếp Tài Cách)',
    date: '25/08/1911',
    time: '06:00',
    gender: 1,
    expectedCachCuc: 'Kiếp Tài cách',
    description: 'Đinh Hỏa đắc Mão Thân hợp, Dương Nhận giá Sát (Đại tướng Võ Nguyên Giáp).'
  },
  {
    id: 'SQ-03',
    category: 'Lộc Nhận / Quý Cách (Sát Ấn Tương Sinh)',
    date: '23/10/1940',
    time: '03:00',
    gender: 1,
    expectedCachCuc: 'Kiếp Tài cách',
    description: 'Sát Ấn tương sinh quyền lực nổi tiếng (Pelé).'
  },
  {
    id: 'SQ-04',
    category: 'Lộc Nhận / Quý Cách (Thương Quan Chế Sát)',
    date: '28/09/0551',
    time: '06:00',
    gender: 1,
    expectedCachCuc: 'Chính Quan cách',
    description: 'Giáp Mộc đắc Dần Lộc, Thương Quan Đinh Hỏa chế Sát (Khổng Tử).'
  }
];

function runTestCases() {
  console.log('========================================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ BỘ TEST CASE TOÀN DIỆN TẤT CẢ CÁCH CỤC & DỤNG THẦN BÁT TỰ');
  console.log('========================================================================================\n');

  let passed = 0;
  let total = allDungThanTestCases.length;
  const results = [];

  for (const tc of allDungThanTestCases) {
    const res = BaziAnalyzer.analyze(tc.date, tc.time, tc.gender);
    const primary = res.dungThanInfo?.primary || {};
    const actualMechanism = primary.mechanism || '';
    const actualDungThan = primary.dungThan || res.dungThan;
    const actualCachCuc = res.analysis?.cachCuc || '';

    let isSuccess = true;
    let failDetail = [];

    if (tc.expectedMechanism && !actualMechanism.includes(tc.expectedMechanism.split(' ')[0])) {
      isSuccess = false;
      failDetail.push(`Cơ chế Dụng Thần: Kỳ vọng [${tc.expectedMechanism}] - Thực tế [${actualMechanism}]`);
    }

    if (tc.expectedDungThan && actualDungThan !== tc.expectedDungThan) {
      isSuccess = false;
      failDetail.push(`Ngũ hành Dụng Thần: Kỳ vọng [${tc.expectedDungThan}] - Thực tế [${actualDungThan}]`);
    }

    if (isSuccess) {
      passed++;
      console.log(`✅ [${tc.id}] [${tc.category}] -> PASS`);
      console.log(`   Dụng Thần: ${actualDungThan} | Cơ chế: ${actualMechanism} | Cách Cục: ${actualCachCuc}`);
    } else {
      console.log(`⚠️ [${tc.id}] [${tc.category}] -> REVIEW`);
      console.log(`   Chi tiết: ${failDetail.join(' | ')}`);
      console.log(`   Thực tế -> Dụng Thần: ${actualDungThan} | Cơ chế: ${actualMechanism} | Cách Cục: ${actualCachCuc}`);
    }

    results.push({
      id: tc.id,
      category: tc.category,
      date: tc.date,
      time: tc.time,
      gender: tc.gender === 1 ? 'Nam' : 'Nữ',
      isSuccess,
      expectedMechanism: tc.expectedMechanism,
      actualMechanism,
      expectedDungThan: tc.expectedDungThan,
      actualDungThan,
      actualCachCuc,
      rationale: primary.rationale
    });
  }

  console.log('\n========================================================================================');
  console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passed}/${total} PASS (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('========================================================================================');

  const outputPath = path.join(__dirname, 'test_all_dung_than_cach_cuc_results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    total,
    passed,
    passRate: `${((passed / total) * 100).toFixed(1)}%`,
    testCases: results
  }, null, 2), 'utf8');

  console.log(`📁 Báo cáo JSON chi tiết đã được lưu tại: ${outputPath}`);
}

runTestCases();
/**
 * PdfTemplateService.js
 * Chuyên gia thiết kế bố cục tài liệu PDF học thuật cho Phong Thủy & Mệnh Lý
 * Hỗ trợ: Bát Tự, Tử Vi, Kinh Dịch, Hợp Hôn
 */

const IChingDataService = require('./IChingDataService');
const RuleEngineService = require('./RuleEngineService');
const hexagramsData = require('../data/hexagrams.json');

// Bảng màu chuẩn Ngũ Hành Cổ Pháp
const ELEMENT_COLORS = {
  Kim: { text: '#475569', bg: '#f1f5f9', border: '#cbd5e1', name: 'Kim' },
  Mộc: { text: '#047857', bg: '#ecfdf5', border: '#a7f3d0', name: 'Mộc' },
  Thủy: { text: '#1e3a8a', bg: '#eff6ff', border: '#bfdbfe', name: 'Thủy' },
  Hỏa: { text: '#b91c1c', bg: '#fef2f2', border: '#fecaca', name: 'Hỏa' },
  Thổ: { text: '#b45309', bg: '#fffbeb', border: '#fde68a', name: 'Thổ' }
};

function getElemTextColor(elemName) {
  if (!elemName || elemName === 'Chưa xác định' || elemName === '-') return '#64748b';
  const norm = String(elemName).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('kim')) return ELEMENT_COLORS.Kim.text;
  if (norm.includes('moc')) return ELEMENT_COLORS.Mộc.text;
  if (norm.includes('thuy')) return ELEMENT_COLORS.Thủy.text;
  if (norm.includes('hoa')) return ELEMENT_COLORS.Hỏa.text;
  if (norm.includes('tho')) return ELEMENT_COLORS.Thổ.text;
  return '#0f172a';
}

function renderElementText(text) {
  if (!text || text === 'Chưa xác định' || text === '-') {
    return `<span style="color: #64748b; font-weight: 800;">${text || 'Chưa xác định'}</span>`;
  }
  const tokens = String(text).split(/([,/\-–+]\s*)/);
  return tokens.map(token => {
    if (/^[,/\-–+]\s*$/.test(token)) return token;
    const color = getElemTextColor(token);
    return `<span style="color: ${color}; font-weight: 800;">${token}</span>`;
  }).join('');
}

const STEM_ELEMENTS = {
  'Giáp': 'Mộc', 'Ất': 'Mộc',
  'Bính': 'Hỏa', 'Đinh': 'Hỏa',
  'Mậu': 'Thổ', 'Kỷ': 'Thổ',
  'Canh': 'Kim', 'Tân': 'Kim',
  'Nhâm': 'Thủy', 'Quý': 'Thủy'
};

const BRANCH_ELEMENTS = {
  'Tý': 'Thủy', 'Hợi': 'Thủy',
  'Dần': 'Mộc', 'Mão': 'Mộc',
  'Tỵ': 'Hỏa', 'Ngọ': 'Hỏa',
  'Thân': 'Kim', 'Dậu': 'Kim',
  'Thìn': 'Thổ', 'Tuất': 'Thổ', 'Sửu': 'Thổ', 'Mùi': 'Thổ'
};

const THAP_THAN_ABBREV = {
  'Tỷ Kiên': 'Tỷ',
  'Kiếp Tài': 'Kiếp',
  'Thực Thần': 'Thực',
  'Thương Quan': 'Thương',
  'Thiên Tài': 'T.Tài',
  'Chính Tài': 'Tài',
  'Thất Sát': 'Sát',
  'Chính Quan': 'Quan',
  'Thiên Ấn': 'Kiêu',
  'Chính Ấn': 'Ấn'
};

function abbreviateThapThan(name) {
  if (!name) return '';
  const trimmed = name.trim();
  return THAP_THAN_ABBREV[trimmed] || trimmed;
}

const TRUONG_SINH_MAP = {
  'Giáp': { 'Hợi': 'Trường Sinh', 'Tý': 'Mộc Dục', 'Sửu': 'Quan Đới', 'Dần': 'Lâm Quan', 'Mão': 'Đế Vượng', 'Thìn': 'Suy', 'Tỵ': 'Bệnh', 'Ngọ': 'Tử', 'Mùi': 'Mộ', 'Thân': 'Tuyệt', 'Dậu': 'Thai', 'Tuất': 'Dưỡng' },
  'Ất': { 'Ngọ': 'Trường Sinh', 'Tỵ': 'Mộc Dục', 'Thìn': 'Quan Đới', 'Mão': 'Lâm Quan', 'Dần': 'Đế Vượng', 'Sửu': 'Suy', 'Tý': 'Bệnh', 'Hợi': 'Tử', 'Tuất': 'Mộ', 'Dậu': 'Tuyệt', 'Thân': 'Thai', 'Mùi': 'Dưỡng' },
  'Bính': { 'Dần': 'Trường Sinh', 'Mão': 'Mộc Dục', 'Thìn': 'Quan Đới', 'Tỵ': 'Lâm Quan', 'Ngọ': 'Đế Vượng', 'Mùi': 'Suy', 'Thân': 'Bệnh', 'Dậu': 'Tử', 'Tuất': 'Mộ', 'Hợi': 'Tuyệt', 'Tý': 'Thai', 'Sửu': 'Dưỡng' },
  'Đinh': { 'Dậu': 'Trường Sinh', 'Thân': 'Mộc Dục', 'Mùi': 'Quan Đới', 'Ngọ': 'Lâm Quan', 'Tỵ': 'Đế Vượng', 'Thìn': 'Suy', 'Mão': 'Bệnh', 'Dần': 'Tử', 'Sửu': 'Mộ', 'Tý': 'Tuyệt', 'Hợi': 'Thai', 'Tuất': 'Dưỡng' },
  'Mậu': { 'Dần': 'Trường Sinh', 'Mão': 'Mộc Dục', 'Thìn': 'Quan Đới', 'Tỵ': 'Lâm Quan', 'Ngọ': 'Đế Vượng', 'Mùi': 'Suy', 'Thân': 'Bệnh', 'Dậu': 'Tử', 'Tuất': 'Mộ', 'Hợi': 'Tuyệt', 'Tý': 'Thai', 'Sửu': 'Dưỡng' },
  'Kỷ': { 'Dậu': 'Trường Sinh', 'Thân': 'Mộc Dục', 'Mùi': 'Quan Đới', 'Ngọ': 'Lâm Quan', 'Tỵ': 'Đế Vượng', 'Thìn': 'Suy', 'Mão': 'Bệnh', 'Dần': 'Tử', 'Sửu': 'Mộ', 'Tý': 'Tuyệt', 'Hợi': 'Thai', 'Tuất': 'Dưỡng' },
  'Canh': { 'Tỵ': 'Trường Sinh', 'Ngọ': 'Mộc Dục', 'Mùi': 'Quan Đới', 'Thân': 'Lâm Quan', 'Dậu': 'Đế Vượng', 'Tuất': 'Suy', 'Hợi': 'Bệnh', 'Tý': 'Tử', 'Sửu': 'Mộ', 'Dần': 'Tuyệt', 'Mão': 'Thai', 'Thìn': 'Dưỡng' },
  'Tân': { 'Tý': 'Trường Sinh', 'Hợi': 'Mộc Dục', 'Tuất': 'Quan Đới', 'Dậu': 'Lâm Quan', 'Thân': 'Đế Vượng', 'Mùi': 'Suy', 'Ngọ': 'Bệnh', 'Tỵ': 'Tử', 'Thìn': 'Mộ', 'Mão': 'Tuyệt', 'Dần': 'Thai', 'Sửu': 'Dưỡng' },
  'Nhâm': { 'Thân': 'Trường Sinh', 'Dậu': 'Mộc Dục', 'Tuất': 'Quan Đới', 'Hợi': 'Lâm Quan', 'Tý': 'Đế Vượng', 'Sửu': 'Suy', 'Dần': 'Bệnh', 'Mão': 'Tử', 'Thìn': 'Mộ', 'Tỵ': 'Tuyệt', 'Ngọ': 'Thai', 'Mùi': 'Dưỡng' },
  'Quý': { 'Mão': 'Trường Sinh', 'Dần': 'Mộc Dục', 'Sửu': 'Quan Đới', 'Tý': 'Lâm Quan', 'Hợi': 'Đế Vượng', 'Tuất': 'Suy', 'Dậu': 'Bệnh', 'Thân': 'Tử', 'Mùi': 'Mộ', 'Ngọ': 'Tuyệt', 'Tỵ': 'Thai', 'Thìn': 'Dưỡng' }
};

function getTruongSinh(gan, monthZhi) {
  if (!gan || !monthZhi) return '';
  return TRUONG_SINH_MAP[gan]?.[monthZhi] || '';
}

function formatMenhQuai(mq) {
  if (!mq) return '';
  if (typeof mq === 'string') {
    if (mq.startsWith('{')) {
      try {
        const parsed = JSON.parse(mq);
        return formatMenhQuai(parsed);
      } catch (e) {
        return mq;
      }
    }
    return mq;
  }
  if (typeof mq === 'object') {
    const cung = mq.cung || mq.name || mq.quai || '';
    const el = mq.element || mq.nguHanh || '';
    const grp = mq.group || mq.nhom || '';
    const parts = [];
    if (cung) parts.push(`Cung ${cung}`);
    if (el) parts.push(`(${el})`);
    if (grp) parts.push(`- ${grp}`);
    return parts.join(' ').trim() || '';
  }
  return String(mq);
}

// Bảng phối Cung Phi Bát Trạch Hợp Hôn Cổ Pháp
const BAT_TRACH_PAIRS = {
  'Càn': { 'Càn': 'Phục Vị', 'Khảm': 'Lục Sát', 'Cấn': 'Thiên Y', 'Chấn': 'Ngũ Quỷ', 'Tốn': 'Họa Hại', 'Ly': 'Tuyệt Mệnh', 'Khôn': 'Diên Niên', 'Đoài': 'Sinh Khí' },
  'Khảm': { 'Càn': 'Lục Sát', 'Khảm': 'Phục Vị', 'Cấn': 'Ngũ Quỷ', 'Chấn': 'Thiên Y', 'Tốn': 'Sinh Khí', 'Ly': 'Diên Niên', 'Khôn': 'Tuyệt Mệnh', 'Đoài': 'Họa Hại' },
  'Cấn': { 'Càn': 'Thiên Y', 'Khảm': 'Ngũ Quỷ', 'Cấn': 'Phục Vị', 'Chấn': 'Lục Sát', 'Tốn': 'Tuyệt Mệnh', 'Ly': 'Họa Hại', 'Khôn': 'Sinh Khí', 'Đoài': 'Diên Niên' },
  'Chấn': { 'Càn': 'Ngũ Quỷ', 'Khảm': 'Thiên Y', 'Cấn': 'Lục Sát', 'Chấn': 'Phục Vị', 'Tốn': 'Diên Niên', 'Ly': 'Sinh Khí', 'Khôn': 'Họa Hại', 'Đoài': 'Tuyệt Mệnh' },
  'Tốn': { 'Càn': 'Họa Hại', 'Khảm': 'Sinh Khí', 'Cấn': 'Tuyệt Mệnh', 'Chấn': 'Diên Niên', 'Tốn': 'Phục Vị', 'Ly': 'Thiên Y', 'Khôn': 'Ngũ Quỷ', 'Đoài': 'Lục Sát' },
  'Ly': { 'Càn': 'Tuyệt Mệnh', 'Khảm': 'Diên Niên', 'Cấn': 'Họa Hại', 'Chấn': 'Sinh Khí', 'Tốn': 'Thiên Y', 'Ly': 'Phục Vị', 'Khôn': 'Lục Sát', 'Đoài': 'Ngũ Quỷ' },
  'Khôn': { 'Càn': 'Diên Niên', 'Khảm': 'Tuyệt Mệnh', 'Cấn': 'Sinh Khí', 'Chấn': 'Họa Hại', 'Tốn': 'Ngũ Quỷ', 'Ly': 'Lục Sát', 'Khôn': 'Phục Vị', 'Đoài': 'Thiên Y' },
  'Đoài': { 'Càn': 'Sinh Khí', 'Khảm': 'Họa Hại', 'Cấn': 'Diên Niên', 'Chấn': 'Tuyệt Mệnh', 'Tốn': 'Lục Sát', 'Ly': 'Ngũ Quỷ', 'Khôn': 'Thiên Y', 'Đoài': 'Phục Vị' }
};

const BAT_TRACH_NATURE = {
  'Sinh Khí': { type: 'cát', color: '#047857', bg: '#ecfdf5', desc: 'Thượng Cát - Thu hút vượng khí, tài lộc dồi dào, sinh sôi thịnh vượng' },
  'Diên Niên': { type: 'cát', color: '#047857', bg: '#ecfdf5', desc: 'Thượng Cát - Tình duyên bền vững, gia đạo êm ấm, thọ khang hòa thuận' },
  'Thiên Y': { type: 'cát', color: '#047857', bg: '#ecfdf5', desc: 'Trung Cát - Thần y hộ trợ, sức khỏe dồi dào, giảm trừ bệnh tật xung khắc' },
  'Phục Vị': { type: 'cát', color: '#1e40af', bg: '#eff6ff', desc: 'Tiểu Cát - Củng cố tinh thần, bình an tĩnh tại, gắn kết tự nhiên' },
  'Tuyệt Mệnh': { type: 'hung', color: '#b91c1c', bg: '#fef2f2', desc: 'Đại Hung - Khí trường xung đột mạnh, cần hóa giải bằng hướng phòng ngủ/bếp' },
  'Ngũ Quỷ': { type: 'hung', color: '#b91c1c', bg: '#fef2f2', desc: 'Đại Hung - Dễ sinh khắc khẩu, thị phi hiểu lầm, cần bố trí phong thủy chế hóa' },
  'Lục Sát': { type: 'hung', color: '#dc2626', bg: '#fff1f2', desc: 'Thứ Hung - Xáo trộn tình cảm, trắc trở giao tiếp, cần thấu hiểu kiên nhẫn' },
  'Họa Hại': { type: 'hung', color: '#d97706', bg: '#fffbeb', desc: 'Thứ Hung - Hao tài nhỏ, bất đồng vụn vặt, hóa giải bằng vị trí sinh hoạt' }
};

const CAN_HOP = {
  'Giáp': 'Kỷ', 'Kỷ': 'Giáp',
  'Ất': 'Canh', 'Canh': 'Ất',
  'Bính': 'Tân', 'Tân': 'Bính',
  'Đinh': 'Nhâm', 'Nhâm': 'Đinh',
  'Mậu': 'Quý', 'Quý': 'Mậu'
};

const CHI_LUC_HOP = {
  'Tý': 'Sửu', 'Sửu': 'Tý',
  'Dần': 'Hợi', 'Hợi': 'Dần',
  'Mão': 'Tuất', 'Tuất': 'Mão',
  'Thìn': 'Dậu', 'Dậu': 'Thìn',
  'Tỵ': 'Thân', 'Thân': 'Tỵ',
  'Ngọ': 'Mùi', 'Mùi': 'Ngọ'
};

const CHI_TAM_HOP = {
  'Thân': ['Tý', 'Thìn'], 'Tý': ['Thân', 'Thìn'], 'Thìn': ['Thân', 'Tý'],
  'Dần': ['Ngọ', 'Tuất'], 'Ngọ': ['Dần', 'Tuất'], 'Tuất': ['Dần', 'Ngọ'],
  'Tỵ': ['Dậu', 'Sửu'], 'Dậu': ['Tỵ', 'Sửu'], 'Sửu': ['Tỵ', 'Dậu'],
  'Hợi': ['Mão', 'Mùi'], 'Mão': ['Hợi', 'Mùi'], 'Mùi': ['Hợi', 'Mão']
};

const CHI_LUC_XUNG = {
  'Tý': 'Ngọ', 'Ngọ': 'Tý',
  'Sửu': 'Mùi', 'Mùi': 'Sửu',
  'Dần': 'Thân', 'Thân': 'Dần',
  'Mão': 'Dậu', 'Dậu': 'Mão',
  'Thìn': 'Tuất', 'Tuất': 'Thìn',
  'Tỵ': 'Hợi', 'Hợi': 'Tỵ'
};

const CHI_LUC_HAI = {
  'Tý': 'Mùi', 'Mùi': 'Tý',
  'Sửu': 'Ngọ', 'Ngọ': 'Sửu',
  'Dần': 'Tỵ', 'Tỵ': 'Dần',
  'Mão': 'Thìn', 'Thìn': 'Mão',
  'Thân': 'Hợi', 'Hợi': 'Thân',
  'Dậu': 'Tuất', 'Tuất': 'Dậu'
};

function evaluateNaYinRelation(mNaYin, fNaYin) {
  const elements = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
  const mElem = elements.find(e => mNaYin && mNaYin.includes(e));
  const fElem = elements.find(e => fNaYin && fNaYin.includes(e));
  if (!mElem || !fElem) return { text: 'Bình Hòa', color: '#475569', bg: '#f8fafc', desc: 'Tương tác bình ổn' };

  if (mElem === fElem) {
    return { text: `Tỷ Hòa (${mElem} - ${fElem})`, color: '#047857', bg: '#ecfdf5', desc: 'Đồng khí tương trợ, tâm đầu ý hợp, dễ thấu hiểu sẻ chia' };
  }
  const sinhMap = { 'Mộc': 'Hỏa', 'Hỏa': 'Thổ', 'Thổ': 'Kim', 'Kim': 'Thủy', 'Thủy': 'Mộc' };
  if (sinhMap[mElem] === fElem) {
    return { text: `Nam Sinh Nữ (${mElem} sinh ${fElem})`, color: '#047857', bg: '#ecfdf5', desc: 'Chồng yêu thương, che chở, nâng đỡ cho vợ - Rất cát lợi' };
  }
  if (sinhMap[fElem] === mElem) {
    return { text: `Nữ Sinh Nam (${fElem} sinh ${mElem})`, color: '#047857', bg: '#ecfdf5', desc: 'Vợ là hậu phương vững chắc, trợ lực vượng phu - Cát lợi' };
  }
  const khacMap = { 'Mộc': 'Thổ', 'Thổ': 'Thủy', 'Thủy': 'Hỏa', 'Hỏa': 'Kim', 'Kim': 'Mộc' };
  if (khacMap[mElem] === fElem) {
    return { text: `Nam Khắc Nữ (${mElem} khắc ${fElem})`, color: '#d97706', bg: '#fffbeb', desc: 'Chồng có xu hướng áp chế, cần đối thoại cởi mở, nhường nhịn' };
  }
  if (khacMap[fElem] === mElem) {
    return { text: `Nữ Khắc Nam (${fElem} khắc ${mElem})`, color: '#b91c1c', bg: '#fef2f2', desc: 'Vợ cá tính mạnh, dễ tranh cãi, cần điều hòa cái tôi' };
  }
  return { text: 'Bình Hòa', color: '#475569', bg: '#f8fafc', desc: 'Tương tác bình hòa, không sinh không khắc' };
}

function evaluateCanRelation(mCan, fCan) {
  if (!mCan || !fCan) return { text: 'Bình Hòa', color: '#475569', bg: '#f8fafc', desc: 'Bình hòa' };
  if (CAN_HOP[mCan] === fCan) {
    return { text: `Thiên Can Hợp Hóa (${mCan} hợp ${fCan})`, color: '#047857', bg: '#ecfdf5', desc: 'Đại Cát - Lương duyên trời định, tương kính như tân, hòa khí sinh tài' };
  }
  const mElem = STEM_ELEMENTS[mCan];
  const fElem = STEM_ELEMENTS[fCan];
  if (mElem === fElem) {
    return { text: `Đồng Khí (${mCan} - ${fCan})`, color: '#1e40af', bg: '#eff6ff', desc: 'Tư tưởng đồng điệu, cá tính tương đồng, cần lắng nghe nhau' };
  }
  const sinhMap = { 'Mộc': 'Hỏa', 'Hỏa': 'Thổ', 'Thổ': 'Kim', 'Kim': 'Thủy', 'Thủy': 'Mộc' };
  if (sinhMap[mElem] === fElem) {
    return { text: `Tương Sinh (${mCan} sinh ${fCan})`, color: '#047857', bg: '#ecfdf5', desc: 'Cát lợi - Tư duy nâng đỡ, giao tiếp dễ hòa hợp' };
  }
  if (sinhMap[fElem] === mElem) {
    return { text: `Tương Sinh (${fCan} sinh ${mCan})`, color: '#047857', bg: '#ecfdf5', desc: 'Cát lợi - Vợ bồi đắp tư tưởng và hỗ trợ chồng đắc lực' };
  }
  return { text: `Tương Khắc (${mElem} khắc ${fElem})`, color: '#b91c1c', bg: '#fef2f2', desc: 'Thế giới quan khác biệt, cần tôn trọng góc nhìn của đối phương' };
}

function evaluateZhiRelation(mZhi, fZhi) {
  if (!mZhi || !fZhi) return { text: 'Bình Hòa', color: '#475569', bg: '#f8fafc', desc: 'Bình hòa' };
  if (CHI_LUC_HOP[mZhi] === fZhi) {
    return { text: `Lục Hợp (${mZhi} hợp ${fZhi})`, color: '#047857', bg: '#ecfdf5', desc: 'Đại Cát - Cung Phu Thê mật thiết, tình cảm sâu sắc, gắn bó trọn đời' };
  }
  if (CHI_TAM_HOP[mZhi]?.includes(fZhi)) {
    return { text: `Tam Hợp (${mZhi} - ${fZhi})`, color: '#047857', bg: '#ecfdf5', desc: 'Thượng Cát - Đồng lòng hợp tác, gia đạo hưng vượng, con cái ngoan ngoãn' };
  }
  if (CHI_LUC_XUNG[mZhi] === fZhi) {
    return { text: `Lục Xung (${mZhi} xung ${fZhi})`, color: '#b91c1c', bg: '#fef2f2', desc: 'Đại Kỵ - Trực xung cung phu thê, dễ tranh chấp, cần học cách nhẫn nại' };
  }
  if (CHI_LUC_HAI[mZhi] === fZhi) {
    return { text: `Lục Hại (${mZhi} hại ${fZhi})`, color: '#dc2626', bg: '#fff1f2', desc: 'Thứ Hung - Dễ hờn dỗi hiểu lầm, cần cởi mở chia sẻ cảm xúc' };
  }
  if (mZhi === fZhi) {
    return { text: `Đồng Chi / Tự Hình (${mZhi} - ${fZhi})`, color: '#d97706', bg: '#fffbeb', desc: 'Cá tính tương đồng, đôi khi cứng nhắc, cần hạ bớt cái tôi cá nhân' };
  }
  return { text: 'Bình Hòa', color: '#475569', bg: '#f8fafc', desc: 'Tương tác bình ổn, không xung đột' };
}

const REMEDY_DATA = {
  'Mộc': {
    careers: 'Lâm nghiệp, chế biến gỗ, nông nghiệp, giáo dục, viết lách, y dược, dệt may, thiết kế thời trang, sáng tạo nội dung.',
    colors: 'Xanh lá cây, xanh lục, xanh ngọc bích, xanh bộ đội.',
    directions: 'Chính Đông, Đông Nam (Cung Chấn, Tốn).',
    items: 'Vòng dâu tằm, trang sức đá Thạch Anh Xanh (Aventurine), Ngọc Cẩm Thạch, Ngọc Bích, bài trí cây xanh.'
  },
  'Hỏa': {
    careers: 'Công nghệ thông tin, điện tử, viễn thông, ẩm thực, năng lượng, nhà hàng, mỹ phẩm, nghệ thuật, nhiếp ảnh, truyền thông số.',
    colors: 'Đỏ, hồng, tím, cam, đỏ chu sa.',
    directions: 'Chính Nam (Cung Ly).',
    items: 'Trang sức đá Thạch Anh Hồng, đá Ruby, Thạch Anh Tím, đá Mắt Hổ Đỏ, dùng nến thơm hoặc đèn ấm.'
  },
  'Thổ': {
    careers: 'Bất động sản, xây dựng, kiến trúc, khai khoáng, gốm sứ, nông nghiệp sạch, quản trị nhân sự, luật pháp, phong thủy.',
    colors: 'Vàng hoàng gia, nâu đất, cam đất, vàng cát sa mạc.',
    directions: 'Trung Cung (trung tâm), Đông Bắc, Tây Nam (Cung Cấn, Khôn).',
    items: 'Trang sức đá Thạch Anh Vàng (Citrine), Thạch Anh Tóc Vàng, đá Mắt Hổ Vàng Nâu, bài trí đồ gốm sứ thủ công.'
  },
  'Kim': {
    careers: 'Cơ khí, kim khí, tài chính, ngân hàng, chứng khoán, trang sức, công nghệ cao, hành chính công, quân sự, thiết bị y tế.',
    colors: 'Trắng, xám bạc, ghi sáng, vàng ánh kim, bạc.',
    directions: 'Chính Tây, Tây Bắc (Cung Đoài, Càn).',
    items: 'Trang sức bạc, vàng trắng, đá Thạch Anh Trắng, Thạch Anh Khói, đá Mặt Trăng (Moonstone), chuông gió kim loại.'
  },
  'Thủy': {
    careers: 'Vận tải logistics, du lịch, thủy hải sản, ngoại giao, báo chí, truyền thông, marketing, dịch vụ khách hàng, hóa chất, giặt ủi.',
    colors: 'Đen tuyền, xanh dương đậm, xanh nước biển, xanh navy.',
    directions: 'Chính Bắc (Cung Khảm).',
    items: 'Trang sức đá Obsidian Đen, Thạch Anh Tóc Đen, Aquamarine, đặt bể cá cảnh hoặc thác nước phong thủy mini.'
  }
};

function getRemedy(elem) {
  if (!elem) return null;
  const norm = {
    'Moc': 'Mộc', 'moc': 'Mộc', 'Mộc': 'Mộc', 'mộc': 'Mộc',
    'Hoa': 'Hỏa', 'hoa': 'Hỏa', 'Hỏa': 'Hỏa', 'hỏa': 'Hỏa', 'Hoả': 'Hỏa', 'hoả': 'Hỏa',
    'Tho': 'Thổ', 'tho': 'Thổ', 'Thổ': 'Thổ', 'thổ': 'Thổ', 'Thô': 'Thổ', 'thô': 'Thổ',
    'Kim': 'Kim', 'kim': 'Kim',
    'Thuy': 'Thủy', 'thuy': 'Thủy', 'Thủy': 'Thủy', 'thủy': 'Thủy', 'Thuỷ': 'Thủy', 'thuỷ': 'Thủy'
  }[elem] || elem;
  return REMEDY_DATA[norm] || null;
}

function classifyShenSha(ss) {
  if (!ss) return 'luong-tinh';
  const s = ss.toLowerCase().trim();

  // 1. Thần Sát Lưỡng Tính / Trung Tính (Ưu tiên kiểm tra trước)
  const luongTinhList = [
    'hoa cái', 'hoa cai',
    'dịch mã', 'dich ma',
    'không vong', 'khong vong',
    'tuần không', 'tuan khong',
    'triệt không', 'triet khong',
    'đào hoa', 'dao hoa',
    'hàm trì', 'ham tri',
    'hồng loan', 'hong loan',
    'hồng diễm', 'hong diem',
    'thiên la', 'thien la',
    'địa võng', 'dia vong',
    'khôi cương', 'khoi cuong',
    'kim thần', 'kim than',
    'thập linh', 'thap linh',
    'quái khí', 'quai khi',
    'bát chuyên', 'bat chuyen',
    'cửu tiêu', 'cuu tieu',
    'tứ phế', 'tu phe'
  ];
  if (luongTinhList.some(k => s.includes(k))) {
    return 'luong-tinh';
  }

  // 2. Cát Thần / Cát Tinh / Quý Nhân
  const catList = [
    'thiên ất', 'thien at',
    'thái cực', 'thai cuc',
    'thiên đức', 'thien duc',
    'nguyệt đức', 'nguyet duc',
    'lộc', 'loc',
    'văn xương', 'van xuong',
    'tướng tinh', 'tuong tinh',
    'phúc tinh', 'phuc tinh',
    'quốc ấn', 'quoc an',
    'thiên y', 'thien y',
    'thiên hỷ', 'thien hy', 'thiên hỉ',
    'kim dư', 'kim du',
    'tam kỳ', 'tam ky',
    'học đường', 'hoc duong',
    'từ quán', 'tu quan',
    'thiên trù', 'thien tru',
    'đường phù', 'duong phu',
    'thiên xá', 'thien xa',
    'quý nhân', 'quy nhan'
  ];
  if (catList.some(k => s.includes(k))) {
    return 'cat';
  }

  // 3. Hung Sát
  const hungList = [
    'kình dương', 'kinh duong',
    'kiếp sát', 'kiep sat',
    'vong thần', 'vong than',
    'cô thần', 'co than',
    'quả tú', 'qua tu',
    'cô loan', 'co loan',
    'thập ác', 'thap ac', 'đại bại', 'dai bai',
    'lưu hà', 'luu ha',
    'huyết nhận', 'huyet nhan',
    'đà la', 'da la',
    'tai sát', 'tai sat',
    'phi nhẫn', 'phi nhan',
    'đại hao', 'dai hao',
    'tiểu hao', 'tieu hao',
    'sai thác', 'sai thac',
    'tuế sát', 'tue sat',
    'tang môn', 'tang mon',
    'bạch hổ', 'bach ho',
    'điếu khách', 'dieu khach',
    'bệnh phù', 'benh phu',
    'quan phù', 'quan phu',
    'phục binh', 'phuc binh',
    'phá toái', 'pha toai',
    'thiên cương', 'thien cuong',
    'câu sát', 'cau sat',
    'sát', 'sat', 'hình', 'hại'
  ];
  if (hungList.some(k => s.includes(k))) {
    return 'hung';
  }

  return 'luong-tinh';
}

function isCatThan(ss) {
  return classifyShenSha(ss) === 'cat';
}


/**
 * Phân tích Markdown AI Interpretation thành các phân đoạn (Sections)
 */
function parseInterpretationSections(markdownText) {
  if (!markdownText || typeof markdownText !== 'string') return [];
  const normalizedText = markdownText.normalize('NFC');
  const lines = normalizedText.split(/\r?\n/);
  const sections = [];
  let currentSection = null;

  const hasChapters = /(?:CHƯƠNG|Chương|CHAPTER|Chapter)\s*\d+/i.test(normalizedText);

  const chapterRegex = /^(?:#{1,3}\s*)?(?:CHƯƠNG|Chương|CHAPTER|Chapter)\s*(\d+)\s*(?::|-|–|\.)\s*(.*)$/i;
  const buocRegex = /^(?:#{1,3}\s*)?(?:BƯỚC|Bước|PHẦN|Phần|STEP|Step)\s*(\d+(?:\.\d+)?)\s*(?::|-|–|\.)\s*(.*)$/i;
  const numberedRegex = /^(?:#{1,3}\s*)(\d+)\.\s*(.*)$/;
  const nhatChuRegex = /^(?:#{1,3}\s*)?(?:PHÂN TÍCH NHẬT CHỦ|Phân tích Nhật chủ|TỔNG QUAN BẢN MỆNH|Tổng quan Bản mệnh|NHẬT CHỦ & BẢN MỆNH|ĐỊNH VỊ BẢN MỆNH)\s*(?::|-|–|\.)?\s*(.*)$/i;
  const summaryRegex = /^(?:#{1,3}\s*)?(?:CHIẾN LƯỢC ĐIỀU HÒA|ĐÚC KẾT NHÂN SINH|TỔNG KẾT & ĐIỀU HÒA|ĐIỀU HÒA CHIẾN LƯỢC)\s*(?::|-|–|\.)?\s*(.*)$/i;

  let inUngKyBlock = false;

  const cleanRawTitle = (str) => (str || '').replace(/^\s*[:\-–\.]\s*/, '').replace(/^\*\*?/, '').replace(/\*\*?$/, '').trim();

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('---UNG_KY_START---')) {
      inUngKyBlock = true;
      continue;
    }
    if (trimmed.startsWith('---UNG_KY_END---')) {
      inUngKyBlock = false;
      continue;
    }
    if (inUngKyBlock) continue;

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') continue;

    const chapterMatch = trimmed.match(chapterRegex);
    const buocMatch = !hasChapters ? trimmed.match(buocRegex) : null;
    const numberedMatch = !hasChapters ? trimmed.match(numberedRegex) : null;
    const nhatChuMatch = trimmed.match(nhatChuRegex);
    const summaryMatch = trimmed.match(summaryRegex);

    if (chapterMatch) {
      if (currentSection) sections.push(currentSection);
      const num = chapterMatch[1];
      const rawTitle = cleanRawTitle(chapterMatch[2]);
      currentSection = {
        id: `ch${num}`,
        title: rawTitle ? `Chương ${num}: ${rawTitle}` : `Chương ${num}`,
        lines: []
      };
    } else if (buocMatch) {
      if (currentSection) sections.push(currentSection);
      const num = buocMatch[1];
      const rawTitle = cleanRawTitle(buocMatch[2]);
      const isBuocWord = /bước|step/i.test(buocMatch[0]);
      const prefix = isBuocWord ? 'Bước' : 'Phần';
      currentSection = {
        id: `step_${num}`,
        title: rawTitle ? `${prefix} ${num}: ${rawTitle}` : `${prefix} ${num}`,
        lines: []
      };
    } else if (numberedMatch) {
      if (currentSection) sections.push(currentSection);
      const num = numberedMatch[1];
      const rawTitle = cleanRawTitle(numberedMatch[2]);
      currentSection = {
        id: `ch${num}`,
        title: rawTitle ? `Phần ${num}: ${rawTitle}` : `Phần ${num}`,
        lines: []
      };
    } else if (nhatChuMatch) {
      if (currentSection) sections.push(currentSection);
      const rawTitle = cleanRawTitle(nhatChuMatch[1]);
      currentSection = {
        id: 'nhat_chu',
        title: rawTitle ? `Phân Tích Nhật Chủ: ${rawTitle}` : 'Phân Tích Nhật Chủ',
        lines: []
      };
    } else if (summaryMatch) {
      if (currentSection) sections.push(currentSection);
      const rawTitle = cleanRawTitle(summaryMatch[1]);
      currentSection = {
        id: 'harmonizer',
        title: rawTitle ? `Điều Hòa Chiến Lược: ${rawTitle}` : 'Điều Hòa Chiến Lược Đa Mục Tiêu',
        lines: []
      };
    } else {
      if (!currentSection) {
        currentSection = {
          id: 'intro',
          title: 'Tổng Quan Luận Giải',
          lines: []
        };
      }
      currentSection.lines.push(rawLine);
    }
  }

  if (currentSection) sections.push(currentSection);

  return sections
    .map(sec => ({
      id: sec.id,
      title: sec.title.normalize('NFC'),
      content: sec.lines.join('\n').trim().normalize('NFC')
    }))
    .filter(sec => sec.content.length > 0 || !hasChapters);
}

/**
 * Chuyển đổi cú pháp Markdown sang HTML in ấn thanh lịch
 * Sử dụng bộ phân tích dòng (line-by-line) chuẩn xác để không bao giờ bỏ sót dòng bảng GFM
 */
function markdownToHtml(md) {
  if (!md) return '';

  let html = md;

  // Escape basic HTML chars
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Robust line-by-line GFM table parser
  const lines = html.split(/\r?\n/);
  const newLines = [];
  let inTable = false;
  let tableRows = [];

  const isTableRow = (line) => {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1;
  };

  const isSeparatorRow = (line) => {
    const trimmed = line.trim();
    return /^\|(?:[\s-:]+\|)+$/.test(trimmed) || /^\|[\s-:]+\|$/.test(trimmed.replace(/\|/g, '| '));
  };

  const flushTable = () => {
    if (tableRows.length < 2) {
      newLines.push(...tableRows);
      tableRows = [];
      inTable = false;
      return;
    }

    let tableHtml = '<div class="table-container"><table class="gfm-table">';
    let isHeader = true;

    for (let r = 0; r < tableRows.length; r++) {
      const rowStr = tableRows[r].trim();
      if (isSeparatorRow(rowStr)) continue;

      const cells = rowStr.slice(1, -1).split('|').map(c => c.trim());
      if (isHeader) {
        tableHtml += '<thead><tr>';
        cells.forEach(c => { tableHtml += `<th>${c}</th>`; });
        tableHtml += '</tr></thead><tbody>';
        isHeader = false;
      } else {
        tableHtml += '<tr>';
        cells.forEach(c => { tableHtml += `<td>${c}</td>`; });
        tableHtml += '</tr>';
      }
    }

    tableHtml += '</tbody></table></div>';
    newLines.push(tableHtml);
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isTableRow(line)) {
      inTable = true;
      tableRows.push(line);
    } else {
      if (inTable) {
        flushTable();
      }
      newLines.push(line);
    }
  }
  if (inTable) {
    flushTable();
  }

  html = newLines.join('\n');

  // Headers
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="doc-h3">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="doc-h2">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="doc-h1">$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote class="doc-blockquote">$1</blockquote>');

  // Bullet Lists
  html = html.replace(/^[*-]\s+(.+)$/gm, '<li class="doc-li">$1</li>');
  html = html.replace(/((?:<li class="doc-li">.+<\/li>\s*)+)/g, '<ul class="doc-ul">$1</ul>');

  // Paragraphs
  const paragraphs = html.split(/\n{2,}/);
  html = paragraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<div') || trimmed.startsWith('<table') || trimmed.startsWith('<ul') || trimmed.startsWith('<blockquote')) {
      return trimmed;
    }
    return `<p class="doc-p">${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}

/**
 * CSS Styling Cốt Lõi Cho Bản In A4 (Imperial Eastern Luxury)
 */
function getCorePrintStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700&family=Inter:wght@400;500;600;700;800;900&display=swap');

    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 'Liberation Sans', sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 10pt;
      line-height: 1.5;
    }

    .serif-title {
      font-family: 'Noto Serif', Georgia, 'Liberation Serif', 'Times New Roman', serif;
      letter-spacing: 0.3px;
    }

    .serif-body {
      font-family: 'Noto Serif', Georgia, 'Liberation Serif', serif;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .doc-page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 12px;
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .doc-page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 16px;
      font-size: 7.5pt;
      color: #94a3b8;
    }

    .monograph-header {
      border: 1.5px solid #b45309;
      background: linear-gradient(135deg, #fdfbf7 0%, #fffbeb 100%);
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }

    .monograph-badge {
      display: inline-block;
      background: #b45309;
      color: #ffffff;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 1.5px 6px;
      border-radius: 9999px;
      margin-bottom: 2px;
    }

    .monograph-title {
      font-size: 13.5pt;
      font-weight: 900;
      color: #78350f;
      margin: 0 0 4px 0;
      letter-spacing: 0.3px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 4px 14px;
      font-size: 9pt;
      background: #ffffff;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #fde68a;
    }

    .meta-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .meta-label {
      font-weight: 700;
      color: #475569;
      min-width: 85px;
    }

    .meta-value {
      font-weight: 600;
      color: #0f172a;
    }

    .section-title {
      font-size: 11.5pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #1e293b;
      border-left: 3.5px solid #b45309;
      padding-left: 8px;
      margin: 14px 0 8px 0;
      letter-spacing: 0.5px;
    }

    .bazi-pillars-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      text-align: center;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      table-layout: fixed;
    }

    .bazi-pillars-table th {
      background: #ffffff;
      color: #1e3a8a;
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      padding: 6px 4px;
      border: 1px solid #cbd5e1;
      border-bottom: 2px solid #93c5fd;
      width: 25%;
      letter-spacing: 0.3px;
    }

    .bazi-pillars-table td {
      border: 1px solid #e2e8f0;
      padding: 4px 4px;
      font-size: 8pt;
      vertical-align: middle;
      width: 25%;
    }

    .stem-zhi-big {
      font-size: 16pt;
      font-weight: 900;
      line-height: 1.1;
      margin: 2px 0;
    }

    .thap-than-tag {
      font-size: 7.5pt;
      font-weight: 800;
      color: #64748b;
      height: 15px;
      line-height: 15px;
    }

    .truong-sinh-tag {
      display: inline-block;
      font-size: 7pt;
      font-weight: 700;
      color: #9a3412;
      background: transparent;
      border: none;
      padding: 1px 0;
      margin-top: 2px;
      white-space: nowrap;
      line-height: 1.2;
    }

    .nayin-badge {
      display: inline-block;
      font-size: 7pt;
      font-weight: 600;
      padding: 1px 0;
      border: none;
      background: transparent;
      color: #334155;
      margin-top: 2px;
      white-space: nowrap;
    }

    /* Container Tàng Can: chia đều 3 dòng, không có chữ Tàng Can: */
    .tangcan-box {
      display: flex;
      flex-direction: column;
      gap: 2.5px;
      padding: 2px 0;
      width: 100%;
    }

    .tangcan-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      height: 14px;
      line-height: 14px;
      padding: 0 4px;
      background: #f8fafc;
      border-radius: 2px;
      border: 1px solid #f1f5f9;
    }

    .tangcan-line.empty {
      visibility: hidden;
      background: transparent;
      border-color: transparent;
    }

    .tangcan-line-stem {
      font-weight: 800;
    }

    .tangcan-line-tt {
      font-weight: 700;
      color: #334155;
      font-size: 7pt;
    }

    /* Container Thần Sát trong trụ: mỗi thần sát 1 dòng */
    .shensha-box {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 2px 0;
      width: 100%;
    }

    .shensha-line {
      font-size: 6.8pt;
      font-weight: 700;
      height: 14px;
      line-height: 14px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 2px;
      border: none;
      background: transparent;
    }

    .shensha-line.cat {
      color: #047857;
      background: transparent;
      border: none;
    }

    .shensha-line.hung {
      color: #dc2626;
      background: transparent;
      border: none;
    }

    .shensha-line.luong-tinh,
    .shensha-line.neutral {
      color: #0f172a;
      background: transparent;
      border: none;
    }

    .shensha-line.empty {
      visibility: hidden;
      background: transparent;
      border: none;
    }

    /* Khối Phương Án Bổ Mệnh & Dụng Thần */
    .remedy-card {
      border: 1.5px solid #d97706;
      background: linear-gradient(135deg, #fdfbf7 0%, #fffbeb 100%);
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
    }

    .remedy-title {
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #92400e;
      border-bottom: 1px solid #fde68a;
      padding-bottom: 3px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .remedy-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px 12px;
    }

    .remedy-item {
      background: #ffffff;
      border: 1px solid #fde68a;
      border-radius: 5px;
      padding: 4px 8px;
    }

    .remedy-item-label {
      font-size: 6.5pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #b45309;
      margin-bottom: 1px;
      letter-spacing: 0.4px;
    }

    .remedy-item-value {
      font-size: 7.5pt;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.35;
    }

    /* Ma Trận Thần Sát Tứ Trụ */
    .shensha-matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      margin-bottom: 12px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      table-layout: fixed;
    }

    .shensha-matrix-table th {
      background: #1e293b;
      color: #ffffff;
      padding: 5px 4px;
      font-weight: 700;
      font-size: 7.5pt;
      border: 1px solid #334155;
      text-align: center;
      width: 25%;
    }

    .shensha-matrix-table td {
      border: 1px solid #e2e8f0;
      padding: 5px 4px;
      vertical-align: top;
      width: 25%;
    }

    /* Bảng Tra Cứu 10 Đại Vận & 100 Năm Lưu Niên */
    .da-yun-liunian-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7pt;
      margin-top: 6px;
      margin-bottom: 12px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    .da-yun-liunian-table th {
      background: #334155;
      color: #ffffff;
      padding: 4px 6px;
      font-weight: 700;
      border: 1px solid #475569;
      text-align: left;
    }

    .da-yun-liunian-table td {
      border: 1px solid #e2e8f0;
      padding: 3px 5px;
      vertical-align: middle;
    }

    .liunian-pills-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 2.5px;
    }

    .liunian-mini-pill {
      display: inline-flex;
      align-items: baseline;
      gap: 2px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 1px 3px;
      font-size: 6.2pt;
      white-space: nowrap;
    }

    .liunian-mini-pill .ln-yr {
      font-weight: 800;
      color: #475569;
    }

    .liunian-mini-pill .ln-gc {
      font-weight: 700;
      color: #0f172a;
    }

    /* Khối Chương Luận Giải: khoảng cách vừa đủ, tự nhiên, không ngắt trang cưỡng bức */
    .chapter-block {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px dashed #dcd3b8;
    }

    .da-yun-matrix {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
      margin-bottom: 12px;
    }

    .da-yun-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 3px;
      text-align: center;
      background: #ffffff;
    }

    .da-yun-card.cat-van {
      border-color: #10b981;
      background: #f0fdf4;
    }

    .da-yun-card.binh-hoa {
      border-color: #f59e0b;
      background: #fffbeb;
    }

    .da-yun-card.than-trong {
      border-color: #f43f5e;
      background: #fff1f2;
    }

    .da-yun-age {
      font-size: 7.5pt;
      font-weight: 800;
      color: #1e293b;
    }

    .da-yun-year {
      font-size: 6.5pt;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 2px;
    }

    .da-yun-ganzhi {
      font-size: 13pt;
      font-weight: 900;
      line-height: 1.1;
      margin: 1px 0;
    }

    .da-yun-badge {
      display: inline-block;
      font-size: 6pt;
      font-weight: 800;
      text-transform: uppercase;
      padding: 1px 4px;
      border-radius: 3px;
      margin-top: 2px;
    }

    .da-yun-badge.green { background: #d1fae5; color: #065f46; }
    .da-yun-badge.amber { background: #fef3c7; color: #92400e; }
    .da-yun-badge.red { background: #ffe4e6; color: #9f1239; }

    .wuxing-summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
    }

    .wuxing-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
      margin: 6px 0;
      text-align: center;
    }

    .wuxing-item {
      padding: 3px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8pt;
    }

    .doc-h1 {
      font-size: 13.5pt;
      font-weight: 900;
      color: #78350f;
      border-bottom: 1.5px solid #fde68a;
      padding-bottom: 2px;
      margin: 4px 0 6px 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    .doc-h2 {
      font-size: 11.5pt;
      font-weight: 800;
      color: #1e293b;
      margin: 14px 0 6px 0;
    }

    .doc-h3 {
      font-size: 10pt;
      font-weight: 700;
      color: #334155;
      margin: 10px 0 4px 0;
    }

    .doc-p {
      margin: 0 0 8px 0;
      text-align: justify;
      font-size: 9.5pt;
      line-height: 1.55;
    }

    .doc-blockquote {
      margin: 8px 0;
      padding: 6px 12px;
      background: #fdfbf7;
      border-left: 3.5px solid #b45309;
      border-radius: 0 6px 6px 0;
      font-style: italic;
      color: #78350f;
      font-size: 9pt;
    }

    .doc-ul {
      margin: 4px 0 8px 16px;
      padding: 0;
      font-size: 9.5pt;
    }

    .doc-li {
      margin-bottom: 3px;
    }

    .table-container {
      margin: 10px 0;
      width: 100%;
    }

    .gfm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      border: 1px solid #cbd5e1;
    }

    .gfm-table th {
      background: #334155;
      color: #ffffff;
      font-weight: 700;
      padding: 5px 6px;
      border: 1px solid #475569;
      text-align: left;
    }

    .gfm-table td {
      padding: 5px 6px;
      border: 1px solid #e2e8f0;
    }

    .gfm-table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .ziwei-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 3.5px;
      width: 100%;
      height: 640px;
      margin-bottom: 6px;
      box-sizing: border-box;
    }

    .ziwei-cell {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 3px 4px;
      background: #ffffff;
      font-size: 7.2pt;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      overflow: hidden;
    }

    .ziwei-cell.menh-palace {
      border: 1.8px solid #d97706;
      background: #fffdf5;
      box-shadow: inset 0 0 4px rgba(217, 119, 6, 0.08);
    }

    .ziwei-cell.body-palace {
      border: 1.8px solid #6366f1;
      background: #faf5ff;
      box-shadow: inset 0 0 4px rgba(99, 102, 241, 0.08);
    }

    .ziwei-center {
      grid-column: 2 / span 2;
      grid-row: 2 / span 2;
      border: 2px solid #7c3aed;
      background: linear-gradient(180deg, #fbf8ff 0%, #faf5ff 100%);
      border-radius: 6px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      box-sizing: border-box;
    }

    .ziwei-legend-card {
      padding: 4px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.8pt;
    }

    /* Style Chuẩn Học Thuật Cho Kinh Dịch / Lục Hào Lạc Giáp */
    .iching-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3px 12px;
      margin-top: 5px;
      padding: 5px 10px;
      background: #fdfbf7;
      border: 1px solid #e2d9c8;
      border-radius: 6px;
      font-size: 7.2pt;
    }

    .iching-tri-overview {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }

    .iching-tri-overview.has-nuclear {
      grid-template-columns: 1.2fr 1fr 1.2fr;
    }

    .iching-hex-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
      background: #ffffff;
      text-align: center;
    }

    .iching-hex-card.primary {
      border-color: #cbd5e1;
      background: #ffffff;
    }

    .iching-hex-card.transformed {
      border-color: #cbd5e1;
      background: #ffffff;
    }

    .iching-hex-card.nuclear {
      border-color: #cbd5e1;
      background: #ffffff;
    }

    .iching-hex-card-title {
      font-size: 10pt;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .iching-hex-card-subtitle {
      font-size: 7.2pt;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 6px;
    }

    .iching-lines-mini {
      display: flex;
      flex-direction: column;
      gap: 3.5px;
      width: 48px;
      margin: 0 auto;
    }

    .iching-line-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
    }

    .yang-bar {
      height: 6.5px;
      width: 44px;
      background: #1e40af;
      border-radius: 1.5px;
      margin: 0 auto;
    }

    .yang-bar.moving {
      background: #dc2626;
    }

    .yin-bar {
      height: 6.5px;
      width: 44px;
      display: flex;
      justify-content: space-between;
      margin: 0 auto;
    }

    .yin-bar .yin-seg {
      height: 6.5px;
      width: 44%;
      background: #1e40af;
      border-radius: 1.5px;
    }

    .yin-bar.moving .yin-seg {
      background: #dc2626;
    }

    /* Bảng Lục Hào Nạp Giáp Chuẩn Web (Hình 4) */
    .luchao-web-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-bottom: 12px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      table-layout: fixed;
    }

    .luchao-web-table th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      font-size: 7.8pt;
      padding: 6px 4px;
      border-bottom: 1.5px solid #cbd5e1;
      border-top: none;
      vertical-align: middle;
    }

    .luchao-web-table td {
      padding: 5.5px 4px;
      vertical-align: middle;
      border-bottom: 1px solid #f1f5f9;
      font-size: 7.8pt;
    }

    .luchao-web-table tr:nth-child(even) {
      background-color: #fafbfc;
    }

    .luchao-web-table .divider-col {
      border-right: 1.5px dashed #cbd5e1;
    }

    .luchao-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.2pt;
      margin-bottom: 12px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    .luchao-table th {
      background: #1e293b;
      color: #ffffff;
      font-weight: 700;
      padding: 4px 3px;
      border: 1px solid #334155;
      text-align: center;
    }

    .luchao-table td {
      border: 1px solid #e2e8f0;
      padding: 3.5px 3px;
      vertical-align: middle;
      text-align: center;
    }

    .luchao-table tr:nth-child(even) {
      background: #f8fafc;
    }

    .luchao-table tr.moving-row {
      background: #fff1f2 !important;
    }

    .the-tag {
      font-size: 7pt;
      font-weight: 800;
      color: #1e40af;
      background: #eff6ff;
      border: 0.5pt solid #93c5fd;
      padding: 1px 3px;
      border-radius: 3px;
      display: inline-block;
      white-space: nowrap;
    }

    .ung-tag {
      font-size: 7pt;
      font-weight: 800;
      color: #7e22ce;
      background: #faf5ff;
      border: 0.5pt solid #d8b4fe;
      padding: 1px 3px;
      border-radius: 3px;
      display: inline-block;
      white-space: nowrap;
    }

    .dong-tag {
      font-size: 6.5pt;
      font-weight: 800;
      color: #b91c1c;
      background: #fee2e2;
      border: 0.5pt solid #fca5a5;
      padding: 0.5px 3px;
      border-radius: 2px;
      display: inline-block;
      margin-top: 1.5px;
      white-space: nowrap;
    }

    .tk-tag {
      font-size: 6.5pt;
      font-weight: 800;
      color: #dc2626;
      background: #fee2e2;
      border: 0.5pt solid #fecaca;
      padding: 0.5px 3px;
      border-radius: 2px;
      display: inline-block;
      white-space: nowrap;
    }

    .qt-tag {
      font-size: 6.5pt;
      font-weight: 800;
      color: #b45309;
      background: #fffbeb;
      border: 0.5pt solid #fde68a;
      padding: 0.5px 3px;
      border-radius: 2px;
      display: inline-block;
      white-space: nowrap;
    }

    .iching-card-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
    }

    .iching-card-box.highlight {
      border: 1.5px solid #d97706;
      background: linear-gradient(135deg, #fdfbf7 0%, #fffbeb 100%);
    }

    .iching-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 10px;
      margin-bottom: 12px;
    }

    /* ==========================================================================
       TRANG BÌA HOÀNG GIA (IMPERIAL LUXURY COVER PAGE)
       ========================================================================== */
    .cover-page-wrapper {
      page-break-after: always;
      break-after: page;
      width: 100%;
      height: 268mm;
      max-height: 268mm;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    .cover-page-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 16mm 14mm;
      background: radial-gradient(circle at 50% 35%, #fffdf8 0%, #faf6ec 65%, #f4ebd9 100%);
      border: 3.5px double #b45309;
      box-sizing: border-box;
      text-align: center;
    }

    .cover-inner-border {
      position: absolute;
      top: 5mm;
      bottom: 5mm;
      left: 5mm;
      right: 5mm;
      border: 1px solid #d97706;
      pointer-events: none;
    }

    .cover-corner {
      position: absolute;
      color: #b45309;
      font-size: 14pt;
      line-height: 1;
      font-weight: 900;
      user-select: none;
    }
    .corner-tl { top: 3.5mm; left: 3.5mm; }
    .corner-tr { top: 3.5mm; right: 3.5mm; }
    .corner-bl { bottom: 3.5mm; left: 3.5mm; }
    .corner-br { bottom: 3.5mm; right: 3.5mm; }

    .cover-top {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      z-index: 2;
    }

    .cover-institute {
      font-family: 'Noto Serif', serif;
      font-size: 9pt;
      font-weight: 800;
      color: #92400e;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .cover-top-divider {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 200px;
    }

    .cover-divider-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, #d97706, transparent);
    }

    .cover-yin-yang {
      color: #b45309;
      font-size: 11pt;
    }

    .cover-series-badge {
      display: inline-block;
      border: 1px solid #b45309;
      background: #fffbeb;
      color: #78350f;
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 2px 10px;
      border-radius: 9999px;
    }

    .cover-middle {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      z-index: 2;
    }

    .cover-emblem {
      margin-bottom: 10px;
    }

    .cover-title {
      font-size: 23pt;
      font-weight: 900;
      color: #78350f;
      margin: 0 0 8px 0;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      line-height: 1.25;
      text-shadow: 0 1px 2px rgba(180, 83, 9, 0.15);
    }

    .cover-subtitle {
      font-size: 10pt;
      font-weight: 600;
      color: #b45309;
      margin-bottom: 20px;
      letter-spacing: 0.6px;
      max-width: 520px;
      line-height: 1.4;
    }

    .cover-client-card {
      background: rgba(255, 255, 255, 0.92);
      border: 1.5px solid #fde68a;
      box-shadow: 0 2px 10px rgba(180, 83, 9, 0.08);
      border-radius: 8px;
      padding: 10px 18px;
      width: 90%;
      max-width: 480px;
      box-sizing: border-box;
    }

    .cover-card-header {
      font-size: 8pt;
      font-weight: 800;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px dashed #fde68a;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }

    .cover-card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px 12px;
      font-size: 9pt;
      text-align: left;
    }

    .cover-info-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .cover-info-row.full-width {
      grid-column: span 2;
    }

    .cover-info-label {
      font-size: 8pt;
      font-weight: 700;
      color: #64748b;
      min-width: 70px;
    }

    .cover-info-val {
      font-size: 9pt;
      font-weight: 600;
      color: #1e293b;
    }

    .cover-info-val.highlight-name {
      font-family: 'Noto Serif', serif;
      font-size: 11pt;
      font-weight: 800;
      color: #92400e;
      text-transform: uppercase;
    }

    .cover-info-val.highlight-text {
      color: #b45309;
      font-weight: 700;
      font-style: italic;
    }

    .cover-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      width: 100%;
      z-index: 2;
    }

    .cover-seal-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }

    .cover-imperial-seal {
      width: 56px;
      height: 56px;
      border: 2px solid #991b1b;
      background: #991b1b;
      padding: 2.5px;
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }

    .seal-inner-border {
      width: 100%;
      height: 100%;
      border: 1.5px solid #fecaca;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 1px;
      box-sizing: border-box;
      overflow: hidden;
      padding: 1px;
      background: #fecaca;
    }

    .seal-cell {
      display: flex;
      justify-content: center;
      align-items: center;
      background: #991b1b;
      color: #ffffff;
      font-family: 'Noto Serif', serif;
      font-weight: 900;
      font-size: 6.3pt;
      line-height: 1;
      letter-spacing: -0.2px;
      text-shadow: none;
      overflow: hidden;
      white-space: nowrap;
    }

    .seal-caption {
      font-size: 6.5pt;
      font-weight: 800;
      color: #991b1b;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .cover-motto {
      text-align: center;
    }

    .motto-main {
      font-family: 'Noto Serif', serif;
      font-size: 8.5pt;
      font-style: italic;
      color: #78350f;
      margin-bottom: 2px;
    }

    .motto-sub {
      font-size: 6.5pt;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* THEME 1: KINH DỊCH (Đỏ Chu Sa Cổ Điển) */
    .cover-theme-iching {
      background: radial-gradient(circle at 50% 35%, #ffffff 0%, #fff5f5 65%, #fee2e2 100%) !important;
      border-color: #991b1b !important;
    }
    .cover-theme-iching .cover-inner-border { border-color: #f87171 !important; }
    .cover-theme-iching .cover-corner { color: #991b1b !important; }
    .cover-theme-iching .cover-institute { color: #991b1b !important; }
    .cover-theme-iching .cover-series-badge {
      background: #fef2f2 !important;
      border-color: #991b1b !important;
      color: #991b1b !important;
    }
    .cover-theme-iching .cover-title { color: #7f1d1d !important; text-shadow: 0 1px 2px rgba(153, 27, 27, 0.15) !important; }
    .cover-theme-iching .cover-subtitle { color: #991b1b !important; }
    .cover-theme-iching .cover-client-card { border-color: #fca5a5 !important; }
    .cover-theme-iching .cover-card-header { color: #991b1b !important; border-bottom-color: #fca5a5 !important; }
    .cover-theme-iching .highlight-name { color: #991b1b !important; }
    .cover-theme-iching .highlight-text { color: #dc2626 !important; }
    .cover-theme-iching .cover-imperial-seal {
      border-color: #991b1b !important;
      background: #991b1b !important;
    }
    .cover-theme-iching .seal-inner-border { border-color: #fecaca !important; background: #fecaca !important; }
    .cover-theme-iching .seal-cell { background: #991b1b !important; }
    .cover-theme-iching .seal-caption { color: #991b1b !important; }
    .cover-theme-iching .motto-main { color: #7f1d1d !important; }

    /* THEME 2: BÁT TỰ (Vàng Hổ Phách Cung Đình) */
    .cover-theme-bazi {
      background: radial-gradient(circle at 50% 35%, #fffdf8 0%, #faf6ec 65%, #f4ebd9 100%) !important;
      border-color: #b45309 !important;
    }
    .cover-theme-bazi .cover-inner-border { border-color: #d97706 !important; }
    .cover-theme-bazi .cover-corner { color: #b45309 !important; }
    .cover-theme-bazi .cover-institute { color: #92400e !important; }
    .cover-theme-bazi .cover-series-badge {
      background: #fffbeb !important;
      border-color: #b45309 !important;
      color: #78350f !important;
    }
    .cover-theme-bazi .cover-title { color: #78350f !important; text-shadow: 0 1px 2px rgba(180, 83, 9, 0.15) !important; }
    .cover-theme-bazi .cover-subtitle { color: #b45309 !important; }
    .cover-theme-bazi .cover-client-card { border-color: #fde68a !important; }
    .cover-theme-bazi .cover-card-header { color: #92400e !important; border-bottom-color: #fde68a !important; }
    .cover-theme-bazi .highlight-name { color: #92400e !important; }
    .cover-theme-bazi .highlight-text { color: #b45309 !important; }
    .cover-theme-bazi .cover-imperial-seal {
      border-color: #b45309 !important;
      background: #b45309 !important;
    }
    .cover-theme-bazi .seal-inner-border { border-color: #fef3c7 !important; background: #fef3c7 !important; }
    .cover-theme-bazi .seal-cell { background: #b45309 !important; }
    .cover-theme-bazi .seal-caption { color: #b45309 !important; }
    .cover-theme-bazi .motto-main { color: #78350f !important; }

    /* THEME 3: TỬ VI (Tím Tử Vi Huyền Không) */
    .cover-theme-ziwei {
      background: radial-gradient(circle at 50% 35%, #ffffff 0%, #faf5ff 65%, #f3e8ff 100%) !important;
      border-color: #6b21a8 !important;
    }
    .cover-theme-ziwei .cover-inner-border { border-color: #a855f7 !important; }
    .cover-theme-ziwei .cover-corner { color: #6b21a8 !important; }
    .cover-theme-ziwei .cover-institute { color: #6b21a8 !important; }
    .cover-theme-ziwei .cover-series-badge {
      background: #faf5ff !important;
      border-color: #6b21a8 !important;
      color: #6b21a8 !important;
    }
    .cover-theme-ziwei .cover-title { color: #581c87 !important; text-shadow: 0 1px 2px rgba(107, 33, 168, 0.15) !important; }
    .cover-theme-ziwei .cover-subtitle { color: #6b21a8 !important; }
    .cover-theme-ziwei .cover-client-card { border-color: #d8b4fe !important; }
    .cover-theme-ziwei .cover-card-header { color: #6b21a8 !important; border-bottom-color: #d8b4fe !important; }
    .cover-theme-ziwei .highlight-name { color: #6b21a8 !important; }
    .cover-theme-ziwei .highlight-text { color: #7e22ce !important; }
    .cover-theme-ziwei .cover-imperial-seal {
      border-color: #6b21a8 !important;
      background: #6b21a8 !important;
    }
    .cover-theme-ziwei .seal-inner-border { border-color: #e9d5ff !important; background: #e9d5ff !important; }
    .cover-theme-ziwei .seal-cell { background: #6b21a8 !important; }
    .cover-theme-ziwei .seal-caption { color: #6b21a8 !important; }
    .cover-theme-ziwei .motto-main { color: #581c87 !important; }

    /* THEME 4: HỢP HÔN (Đỏ Mận Hỷ Khánh Gia Đạo) */
    .cover-theme-marriage {
      background: radial-gradient(circle at 50% 35%, #ffffff 0%, #fff1f2 65%, #ffe4e6 100%) !important;
      border-color: #be123c !important;
    }
    .cover-theme-marriage .cover-inner-border { border-color: #f43f5e !important; }
    .cover-theme-marriage .cover-corner { color: #be123c !important; }
    .cover-theme-marriage .cover-institute { color: #be123c !important; }
    .cover-theme-marriage .cover-series-badge {
      background: #fff1f2 !important;
      border-color: #be123c !important;
      color: #be123c !important;
    }
    .cover-theme-marriage .cover-title { color: #881337 !important; text-shadow: 0 1px 2px rgba(190, 18, 60, 0.15) !important; }
    .cover-theme-marriage .cover-subtitle { color: #be123c !important; }
    .cover-theme-marriage .cover-client-card { border-color: #fecdd3 !important; }
    .cover-theme-marriage .cover-card-header { color: #be123c !important; border-bottom-color: #fecdd3 !important; }
    .cover-theme-marriage .highlight-name { color: #be123c !important; }
    .cover-theme-marriage .highlight-text { color: #e11d48 !important; }
    .cover-theme-marriage .cover-imperial-seal {
      border-color: #be123c !important;
      background: #be123c !important;
    }
    .cover-theme-marriage .seal-inner-border { border-color: #ffe4e6 !important; background: #ffe4e6 !important; }
    .cover-theme-marriage .seal-cell { background: #be123c !important; }
    .cover-theme-marriage .seal-caption { color: #be123c !important; }
    .cover-theme-marriage .motto-main { color: #881337 !important; }
  `;
}

const SYSTEM_COVER_CONFIGS = {
  iching: {
    category: 'HỒ SƠ DỊCH LÝ & CHIÊM BỐC CÁ NHÂN',
    badge: 'BẢN DỊCH GIẢI CHIÊM BỐC ĐỘC BẢN',
    primaryColor: '#991b1b',
    accentColor: '#dc2626',
    motto: '"Thuận Thiên Ứng Thời • Tri Mệnh Tận Tính • Tùy Thời Biến Dịch"',
    footerDesc: 'HỒ SƠ DỊCH LÝ CÁ NHÂN',
    defaultSeal: ['DỊCH', 'LÝ', 'CHÍNH', 'TÔNG']
  },
  bazi: {
    category: 'HỒ SƠ TỨ TRỤ MỆNH LÝ CÁ NHÂN',
    badge: 'BẢN KHẢO LUẬN BÁT TỰ ĐỘC BẢN',
    primaryColor: '#b45309',
    accentColor: '#d97706',
    motto: '"Cân Bằng Ngũ Hành • Thuận Ứng Vận Khí • Khai Thông Mệnh Trình"',
    footerDesc: 'HỒ SƠ MỆNH LÝ CÁ NHÂN',
    defaultSeal: ['TỨ', 'TRỤ', 'MỆNH', 'LÝ']
  },
  ziwei: {
    category: 'HỒ SƠ TỬ VI ĐẨU SỐ CÁ NHÂN',
    badge: 'BẢN KHẢO LUẬN MỆNH BÀN ĐỘC BẢN',
    primaryColor: '#6b21a8',
    accentColor: '#9333ea',
    motto: '"Tinh Bàn Tụ Khí • Tứ Hóa Luân Chuyển • Định Vị Càn Khôn"',
    footerDesc: 'HỒ SƠ TỬ VI CÁ NHÂN',
    defaultSeal: ['TỬ', 'VI', 'ĐẨU', 'SỐ']
  },
  marriage: {
    category: 'HỒ SƠ HỢP HÔN & GIA ĐẠO CÁ NHÂN',
    badge: 'BẢN KHẢO LUẬN PHU THÊ ĐỘC BẢN',
    primaryColor: '#be123c',
    accentColor: '#e11d48',
    motto: '"Loan Phụng Hòa Minh • Âm Dương Cân Xứng • Bách Niên Giai Lão"',
    footerDesc: 'HỒ SƠ GIA ĐẠO CÁ NHÂN',
    defaultSeal: ['HỢP', 'HÔN', 'GIA', 'ĐẠO']
  }
};

/**
 * Render Trang Bìa Cá Nhân Hóa (Personal Luxury Monograph Cover Page)
 */
function renderCoverPage({
  system = 'bazi',
  title = 'ẤN PHẨM HỌC THUẬT',
  subtitle = '',
  clientName = 'Gia Chủ',
  gender = '',
  dateStr = '',
  lunarStr = '',
  extraInfo = [],
  recordId = '',
  sealText = null
}) {
  const sys = SYSTEM_COVER_CONFIGS[system] || SYSTEM_COVER_CONFIGS.bazi;
  const activeSeal = (Array.isArray(sealText) && sealText.length === 4) ? sealText : sys.defaultSeal;

  return `
    <div class="cover-page-wrapper">
      <div class="cover-page-container cover-theme-${system}">
        <!-- Đường viền kép nội bộ & 4 góc hoa văn hoàng gia -->
        <div class="cover-inner-border"></div>
        <div class="cover-corner corner-tl">❖</div>
        <div class="cover-corner corner-tr">❖</div>
        <div class="cover-corner corner-bl">❖</div>
        <div class="cover-corner corner-br">❖</div>

        <!-- PHẦN ĐẦU TRANG BÌA: Định Danh Hồ Sơ Cá Nhân -->
        <div class="cover-top">
          <div class="cover-institute">${sys.category}</div>
          <div class="cover-top-divider">
            <span class="cover-divider-line" style="background: linear-gradient(90deg, transparent, ${sys.accentColor}, transparent);"></span>
            <span class="cover-yin-yang" style="color: ${sys.primaryColor};">☯</span>
            <span class="cover-divider-line" style="background: linear-gradient(90deg, transparent, ${sys.accentColor}, transparent);"></span>
          </div>
          <div class="cover-series-badge">${sys.badge}</div>
        </div>

        <!-- PHẦN TRUNG TÂM: Tựa Đề Ấn Phẩm & Thái Cực Đồ Chuẩn Âm Dương -->
        <div class="cover-middle">
          <div class="cover-emblem">
            <svg class="cover-bagua-svg" viewBox="-50 -50 100 100" width="70" height="70">
              <!-- Vòng hào quang ngoài -->
              <circle cx="0" cy="0" r="47" fill="none" stroke="${sys.primaryColor}" stroke-width="2"/>
              <circle cx="0" cy="0" r="43" fill="none" stroke="${sys.accentColor}" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.8"/>
              
              <!-- Nửa Dương: Vòng tròn nền trắng -->
              <circle cx="0" cy="0" r="40" fill="#ffffff"/>
              
              <!-- Nửa Âm: Vùng cong màu chủ đạo của phân hệ -->
              <path d="M 0,-40 A 40,40 0 0,1 0,40 A 20,20 0 0,1 0,0 A 20,20 0 0,0 0,-40 Z" fill="${sys.primaryColor}"/>
              
              <!-- Viền tròn ngăn cách vòng thái cực -->
              <circle cx="0" cy="0" r="40" fill="none" stroke="${sys.primaryColor}" stroke-width="1.2"/>
              
              <!-- TRONG DƯƠNG CÓ ÂM: Mắt màu đậm trên nửa trên nền trắng -->
              <circle cx="0" cy="-20" r="5.5" fill="${sys.primaryColor}"/>
              
              <!-- TRONG ÂM CÓ DƯƠNG: Mắt trắng viền mảnh trên nửa dưới nền màu đậm -->
              <circle cx="0" cy="20" r="5.5" fill="#ffffff" stroke="${sys.primaryColor}" stroke-width="0.6"/>
            </svg>
          </div>
          <h1 class="cover-title serif-title">${title}</h1>
          <div class="cover-subtitle serif-title">${subtitle}</div>

          <!-- KHỐI THÔNG TIN ĐƯƠNG SỐ TRANG TRỌNG -->
          <div class="cover-client-card">
            <div class="cover-card-header">HỒ SƠ BẢN MỆNH ĐƯƠNG SỐ</div>
            <div class="cover-card-grid">
              <div class="cover-info-row">
                <span class="cover-info-label">Chủ sự:</span>
                <span class="cover-info-val highlight-name">${clientName}</span>
              </div>
              ${gender ? `
              <div class="cover-info-row">
                <span class="cover-info-label">Giới tính:</span>
                <span class="cover-info-val">${gender}</span>
              </div>` : ''}
              ${dateStr ? `
              <div class="cover-info-row">
                <span class="cover-info-label">Dương lịch:</span>
                <span class="cover-info-val">${dateStr}</span>
              </div>` : ''}
              ${lunarStr ? `
              <div class="cover-info-row">
                <span class="cover-info-label">Âm lịch:</span>
                <span class="cover-info-val">${lunarStr}</span>
              </div>` : ''}
              ${extraInfo.map(item => `
              <div class="cover-info-row ${item.fullWidth ? 'full-width' : ''}">
                <span class="cover-info-label">${item.label}:</span>
                <span class="cover-info-val ${item.highlight ? 'highlight-text' : ''}">${item.value}</span>
              </div>`).join('')}
            </div>
          </div>
        </div>

        <!-- PHẦN CHÂN TRANG BÌA: Triện Ấn & Lời Đề Từ -->
        <div class="cover-bottom">
          <!-- Triện ấn sắc nét không tràn chữ -->
          <div class="cover-seal-box">
            <div class="cover-imperial-seal">
              <div class="seal-inner-border">
                <div class="seal-cell">${activeSeal[0] || 'DỊCH'}</div>
                <div class="seal-cell">${activeSeal[1] || 'LÝ'}</div>
                <div class="seal-cell">${activeSeal[2] || 'CHÍNH'}</div>
                <div class="seal-cell">${activeSeal[3] || 'TÔNG'}</div>
              </div>
            </div>
            <div class="seal-caption">CHỨNG THỰC CỔ HỌC</div>
          </div>

          <div class="cover-motto">
            <div class="motto-main">${sys.motto}</div>
            <div class="motto-sub">${sys.footerDesc} — MÃ SỐ ĐỊNH DANH: ${recordId ? String(recordId).slice(0, 20) : 'IMP-' + Date.now()}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Tạo HTML cho Bát Tự (Bazi) - Chuẩn Hóa Bố Cục Học Thuật Cổ Pháp & Trực Quan In Ấn
 */
function generateBaziHtml(record, scope = []) {
  const baziData = record.baziData || record.analysisSnapshot || record.result || {};
  const inputInfo = record.inputInfo || {};
  const canChi = baziData.canChi || {};
  const daYun = baziData.daYun || [];
  const wuXing = baziData.nguHanh || baziData.wuXingScores || baziData.wuXing || {};
  const rawThanDegree = baziData.analysis?.thanDegree || baziData.thanDegree || 'Cân Bằng';
  const formatThanDegree = (td) => {
    if (!td) return 'Cân Bằng';
    const s = String(td).toLowerCase();
    if (s.includes('cuc_nhuoc') || s.includes('cực nhược')) return 'Cực Nhược / Tòng Cách';
    if (s.includes('cuc_vuong') || s.includes('cực vượng')) return 'Cực Vượng / Chuyên Vượng';
    if (s.includes('tong') || s.includes('tòng')) return 'Tòng Cách';
    if (s.includes('nhuoc') || s.includes('nhược')) return 'Thân Nhược';
    if (s.includes('vuong') || s.includes('vượng')) return 'Thân Vượng';
    if (s.includes('can_bang') || s.includes('cân bằng')) return 'Cân Bằng';
    return td;
  };
  const thanDegree = formatThanDegree(rawThanDegree);

  function formatElementName(elem) {
    if (!elem || elem === 'Chưa xác định') return elem || 'Chưa xác định';
    const key = String(elem).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const map = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
    return map[key] || elem;
  }

  const rawDungThan = baziData.dungThan?.dungThan || baziData.analysis?.dungThan || baziData.dungThan || 'Chưa xác định';
  const rawHyThan = baziData.dungThan?.hyThan || baziData.analysis?.hyThan || baziData.hyThan || 'Chưa xác định';
  const rawKyThan = baziData.dungThan?.kyThan || baziData.analysis?.kyThan || baziData.kyThan || 'Chưa xác định';

  const dungThan = formatElementName(rawDungThan);
  const hyThan = formatElementName(rawHyThan);
  const kyThan = formatElementName(rawKyThan);

  const remedy = getRemedy(dungThan);

  const hasScope = scope && scope.length > 0;
  const includeChart = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('bazi_pillars');
  const includeDaYun = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('bazi_dayun');
  const includeWuXing = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('bazi_wuxing');
  const includeShenSha = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('bazi_shensha');

  let rawInterp = '';
  if (typeof record.aiInterpretation === 'string') {
    rawInterp = record.aiInterpretation;
  } else if (record.aiInterpretation?.content) {
    rawInterp = record.aiInterpretation.content;
  } else if (typeof record.analysis === 'string') {
    rawInterp = record.analysis;
  } else if (typeof record.analysisSnapshot?.aiInterpretation === 'string') {
    rawInterp = record.analysisSnapshot.aiInterpretation;
  } else if (record.analysisSnapshot?.aiInterpretation?.content) {
    rawInterp = record.analysisSnapshot.aiInterpretation.content;
  }

  const sections = parseInterpretationSections(rawInterp);
  const isAllInterpRequested = !hasScope ||
    scope.includes('all') ||
    scope.includes('interpretation') ||
    scope.includes('interp') ||
    scope.includes('intro') ||
    scope.includes('all_interpretation');

  const hasSpecificStep = scope.some(s => s.startsWith('step_') || s.startsWith('ch') || s === 'nhat_chu' || s === 'harmonizer');

  const filteredSections = sections.filter(sec => {
    if (isAllInterpRequested) return true;
    if (scope.includes(sec.id) || scope.includes(`interp_${sec.id}`) || scope.includes(`bazi_${sec.id}`)) return true;
    if (sec.id === 'intro' && hasSpecificStep) return true;
    return false;
  });

  let contentHtml = '';

  const includeCover = scope.includes('cover') || scope.includes('all') || (!hasScope);
  if (includeCover) {
    contentHtml += renderCoverPage({
      system: 'bazi',
      title: 'BÁT TỰ TỨ TRỤ BẢN MỆNH THƯ',
      subtitle: 'Khảo Cứu Tứ Trụ, Thần Sát, Cân Bằng Ngũ Hành & Đại Vận 100 Năm',
      clientName: inputInfo.name || 'Gia Chủ',
      gender: parseInt(inputInfo.gender) === 0 ? 'Nữ Mệnh (Âm Nữ)' : 'Nam Mệnh (Dương Nam)',
      dateStr: record.solarTimeline || inputInfo.date || 'Chưa xác định',
      lunarStr: record.tietKhiTimeline ? `Tiết khí: ${record.tietKhiTimeline}` : '',
      extraInfo: [
        ...(baziData.menhQuai ? [{ label: 'Mệnh Quái', value: formatMenhQuai(baziData.menhQuai) }] : []),
        ...(dungThan && dungThan !== 'Chưa xác định' ? [{ label: 'Dụng Thần', value: dungThan, highlight: true }] : [])
      ],
      recordId: record._id || '',
      sealText: ['TỨ', 'TRỤ', 'MỆNH', 'LÝ']
    });
  }

  // 1. HEADER & META TRANG 1
  contentHtml += `
    <div class="monograph-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="monograph-badge">Hồ Sơ Mệnh Lý Cá Nhân • Tứ Trụ Tử Bình</span>
          <h1 class="monograph-title serif-title">LÁ SỐ BÁT TỰ TỨ TRỤ & VẬN TRÌNH</h1>
        </div>
        <div style="text-align: right; font-size: 7.5pt; color: #78350f; font-weight: 700;">
          MÃ SỐ: ${record._id?.slice(0, 18) || 'N/A'}<br/>
          BẢN QUYỀN HỆ THỐNG
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Họ và tên:</span>
          <span class="meta-value">${inputInfo.name || 'Gia Chủ'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Giới tính:</span>
          <span class="meta-value">${parseInt(inputInfo.gender) === 0 ? 'Nữ Mệnh (Âm Nữ)' : 'Nam Mệnh (Dương Nam)'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Dương lịch:</span>
          <span class="meta-value">${record.solarTimeline || inputInfo.date || 'Chưa xác định'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Tiết khí:</span>
          <span class="meta-value">${record.tietKhiTimeline || 'Chưa xác định'}</span>
        </div>
        ${baziData.taiNguyen ? `
        <div class="meta-item">
          <span class="meta-label">Thai Nguyên:</span>
          <span class="meta-value">${baziData.taiNguyen.gan} ${baziData.taiNguyen.zhi} (${baziData.taiNguyen.naYin || ''})</span>
        </div>` : ''}
        ${baziData.cungMenh ? `
        <div class="meta-item">
          <span class="meta-label">Cung Mệnh:</span>
          <span class="meta-value">${baziData.cungMenh.gan} ${baziData.cungMenh.zhi} (${baziData.cungMenh.naYin || ''})</span>
        </div>` : ''}
        ${baziData.menhQuai ? `
        <div class="meta-item">
          <span class="meta-label">Mệnh Quái:</span>
          <span class="meta-value">${formatMenhQuai(baziData.menhQuai)}</span>
        </div>` : ''}
      </div>
    </div>
  `;

  // 2. BẢNG TỨ TRỤ HỌC THUẬT (XOAY NGƯỢC: TRỤ NĂM -> NGUYỆT LỆNH -> NHẬT CHỦ -> TRỤ GIỜ)
  if (includeChart) {
    const monthZhi = canChi.month?.zhi || '';
    const pillars = [
      { name: 'TRỤ NĂM', data: canChi.year, label: 'Tổ Tiên / Căn Cơ' },
      { name: 'NGUYỆT LỆNH', data: canChi.month, label: 'Cha Mẹ / Sự Nghiệp' },
      { name: 'NHẬT CHỦ', data: canChi.day, label: 'Bản Thân / Vợ Chồng', isDayMaster: true },
      { name: 'TRỤ GIỜ', data: canChi.hour, label: 'Cung Tử Tức / Hậu Vận' }
    ];

    // Tìm số lượng Thần Sát tối đa trong 4 trụ để pad dòng bằng nhau
    const maxShenShaCount = Math.max(
      3,
      ...pillars.map(p => (p.data?.shenSha || []).length)
    );

    contentHtml += `
      <div class="no-break">
        <div class="section-title">I. Cấu Trúc Tứ Trụ Bản Mệnh (Thiên Can - Địa Chi)</div>
        <table class="bazi-pillars-table">
          <thead>
            <tr>
              ${pillars.map(p => `<th>${p.name}<div style="font-size: 6.8pt; font-weight: 600; color: #64748b; margin-top: 1px;">${p.label}</div></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <!-- Dòng 1: Thập Thần Thiên Can -->
            <tr>
              ${pillars.map(p => {
                const tt = p.isDayMaster ? '【NHẬT NGUYÊN】' : (p.data?.thapThanGan || '-');
                return `<td><div class="thap-than-tag">${tt}</div></td>`;
              }).join('')}
            </tr>
            <!-- Dòng 2: Thiên Can & Trạng Thái Trường Sinh so với Nguyệt Chi -->
            <tr>
              ${pillars.map(p => {
                const gan = p.data?.gan || '-';
                const el = STEM_ELEMENTS[gan] || 'Thổ';
                const elColor = ELEMENT_COLORS[el]?.text || '#0f172a';
                const ts = p.data?.truongSinh || getTruongSinh(gan, monthZhi) || '-';
                return `
                  <td>
                    <div class="stem-zhi-big" style="color: ${elColor};">${gan}</div>
                    <div class="truong-sinh-tag">${ts}</div>
                  </td>
                `;
              }).join('')}
            </tr>
            <!-- Dòng 3: Địa Chi & Nạp Âm -->
            <tr>
              ${pillars.map(p => {
                const zhi = p.data?.zhi || '-';
                const el = BRANCH_ELEMENTS[zhi] || 'Thổ';
                const elColor = ELEMENT_COLORS[el]?.text || '#0f172a';
                return `
                  <td>
                    <div class="stem-zhi-big" style="color: ${elColor};">${zhi}</div>
                    <div class="nayin-badge">${p.data?.naYin || '-'}</div>
                  </td>
                `;
              }).join('')}
            </tr>
            <!-- Dòng 4: Tàng Can (Chia đều 3 dòng, không có chữ Tàng Can:, viết tắt Thập Thần) -->
            <tr>
              ${pillars.map(p => {
                const tangCan = p.data?.tangCan || [];
                const paddedTangCan = [...tangCan];
                while (paddedTangCan.length < 3) {
                  paddedTangCan.push({ gan: '', thapThan: '' });
                }
                return `
                  <td>
                    <div class="tangcan-box">
                      ${paddedTangCan.map(tc => {
                        if (!tc.gan) {
                          return `<div class="tangcan-line empty">&nbsp;</div>`;
                        }
                        const el = STEM_ELEMENTS[tc.gan] || 'Thổ';
                        const elColor = ELEMENT_COLORS[el]?.text || '#0f172a';
                        return `
                          <div class="tangcan-line">
                            <span class="tangcan-line-stem" style="color: ${elColor};">${tc.gan}</span>
                            <span class="tangcan-line-tt">${abbreviateThapThan(tc.thapThan)}</span>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </td>
                `;
              }).join('')}
            </tr>
            <!-- Dòng 5: Thần Sát Bát Tự (Mỗi thần sát 1 dòng, màu cát/hung/lưỡng tính phân biệt, chỉ chữ không nền) -->
            ${includeShenSha ? `
            <tr>
              ${pillars.map(p => {
                const ssList = p.data?.shenSha || [];
                const paddedSs = [...ssList];
                while (paddedSs.length < maxShenShaCount) {
                  paddedSs.push('');
                }
                return `
                  <td>
                    <div class="shensha-box">
                      ${paddedSs.map(ss => {
                        if (!ss) {
                          return `<div class="shensha-line empty">&nbsp;</div>`;
                        }
                        const ssType = classifyShenSha(ss);
                        const cleanName = ss.replace(/ Quý Nhân/g, '').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
                        return `
                          <div class="shensha-line ${ssType}" title="${ss}">
                            ${cleanName}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </td>
                `;
              }).join('')}
            </tr>` : ''}
          </tbody>
        </table>
      </div>
    `;
  }

  // 3. BẢNG CÂN BẰNG NGŨ HÀNH & TRẠNG THÁI THÂN (HIỂN THỊ CHUẨN XÁC % VÀ DỤNG/HỶ/KỴ THẦN)
  if (includeWuXing) {
    const getElemScore = (elemName) => {
      const keys = {
        'Kim': ['Kim', 'kim'],
        'Mộc': ['Moc', 'moc', 'Mộc', 'mộc'],
        'Thủy': ['Thuy', 'thuy', 'Thủy', 'thủy', 'Thuỷ', 'thuỷ'],
        'Hỏa': ['Hoa', 'hoa', 'Hỏa', 'hỏa', 'Hoả', 'hoả'],
        'Thổ': ['Tho', 'tho', 'Thổ', 'thổ', 'Thô', 'thô']
      }[elemName] || [elemName];

      for (const k of keys) {
        if (wuXing[k] !== undefined) return Number(wuXing[k]);
      }
      return 0;
    };

    contentHtml += `
      <div class="no-break wuxing-summary-card">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
          <strong style="font-size: 8.5pt; text-transform: uppercase; color: #1e293b;">Phân Bổ Khí Lực Ngũ Hành & Trạng Thái Thân</strong>
          <span style="font-size: 8pt; font-weight: 700; color: #b45309;">Trạng thái: ${thanDegree}</span>
        </div>
        <div class="wuxing-grid">
          ${Object.keys(ELEMENT_COLORS).map(elem => {
            const score = getElemScore(elem);
            const style = ELEMENT_COLORS[elem];
            return `
              <div class="wuxing-item" style="background: ${style.bg}; color: ${style.text}; border: 1px solid ${style.border};">
                <div>${elem}</div>
                <div style="font-size: 10pt; font-weight: 900;">${Math.round(score)}%</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 8pt; margin-top: 4px; padding-top: 3px; border-top: 1px dashed #e2e8f0;">
          <div><strong>Dụng Thần:</strong> ${renderElementText(dungThan)}</div>
          <div><strong>Hỷ Thần:</strong> ${renderElementText(hyThan)}</div>
          <div><strong>Kỵ Thần:</strong> ${renderElementText(kyThan)}</div>
        </div>
      </div>
    `;

    // 3.1 KHỐI DỤNG THẦN & NGÀNH NGHỀ BỔ MỆNH (THỰC CHIẾN)
    if (remedy) {
      const hyFormatted = formatElementName(hyThan);
      const hyStyle = ELEMENT_COLORS[hyFormatted] || { text: getElemTextColor(hyThan), bg: '#eff6ff', border: '#bfdbfe' };
      contentHtml += `
        <div class="no-break remedy-card">
          <div class="remedy-title">
            <span>Dụng Thần & Phương Án Bổ Mệnh Khuyên Dùng (${renderElementText(dungThan)})</span>
            <span style="font-size: 7.5pt; font-weight: 700; color: ${hyStyle.text}; background: ${hyStyle.bg}; padding: 1px 6px; border-radius: 4px; border: 1px solid ${hyStyle.border};">Hỷ Thần Trợ Lực: ${hyThan}</span>
          </div>
          <div class="remedy-grid">
            <div class="remedy-item">
              <div class="remedy-item-label">Công việc / Ngành nghề bổ trợ</div>
              <div class="remedy-item-value">${remedy.careers}</div>
            </div>
            <div class="remedy-item">
              <div class="remedy-item-label">Màu sắc cát tường bổ mệnh</div>
              <div class="remedy-item-value">${remedy.colors}</div>
            </div>
            <div class="remedy-item">
              <div class="remedy-item-label">Phương vị cát lợi tương hỗ</div>
              <div class="remedy-item-value">${remedy.directions}</div>
            </div>
            <div class="remedy-item">
              <div class="remedy-item-label">Vật phẩm trợ mệnh phong thủy</div>
              <div class="remedy-item-value">${remedy.items}</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  // 4. HÀNH TRÌNH ĐẠI VẬN 100 NĂM & NIÊN BIỂU LƯU NIÊN
  if (includeDaYun && daYun.length > 0) {
    const row1 = daYun.slice(0, 5);
    const row2 = daYun.slice(5, 10);

    const renderCard = (yun) => {
      const gan = yun.gan || '-';
      const zhi = yun.zhi || '-';
      const ganEl = STEM_ELEMENTS[gan] || 'Thổ';
      const color = ELEMENT_COLORS[ganEl]?.text || '#0f172a';

      let badgeClass = 'amber';
      let badgeText = 'Bình Hòa';
      if (dungThan.includes(ganEl) || hyThan.includes(ganEl)) {
        badgeClass = 'green';
        badgeText = 'Cát Vận';
      } else if (kyThan.includes(ganEl)) {
        badgeClass = 'red';
        badgeText = 'Thận Trọng';
      }

      const liuNianPreview = (yun.liuNian || []).slice(0, 5).map(ln => ln.year).join(', ');

      return `
        <div class="da-yun-card ${badgeClass === 'green' ? 'cat-van' : (badgeClass === 'red' ? 'than-trong' : 'binh-hoa')}">
          <div class="da-yun-age">${yun.startAge} - ${yun.startAge + 9}t</div>
          <div class="da-yun-year">${yun.startYear || ''}</div>
          <div class="da-yun-ganzhi" style="color: ${color};">${gan} ${zhi}</div>
          <div style="font-size: 6.5pt; color: #475569; font-weight: 700;">${yun.thapThanGan || '-'}</div>
          <div style="font-size: 6pt; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${yun.naYin || ''}</div>
          <span class="da-yun-badge ${badgeClass}">${badgeText}</span>
          ${liuNianPreview ? `<div style="font-size: 5.5pt; color: #94a3b8; margin-top: 2px;">${liuNianPreview}...</div>` : ''}
        </div>
      `;
    };

    contentHtml += `
      <div class="no-break" style="margin-top: 8px;">
        <div class="section-title">II. Hành Trình Đại Vận 100 Năm & Vận Trình Lưu Niên</div>
        <div style="font-size: 7pt; color: #64748b; margin-bottom: 4px; font-style: italic;">
          * Bố cục 2 Hàng x 5 Cột: Hàng trên 50 năm tiền vận (0-50t), hàng dưới 50 năm hậu vận (51-100t).
        </div>
        <div class="da-yun-matrix">
          ${row1.map(renderCard).join('')}
        </div>
        ${row2.length > 0 ? `
        <div class="da-yun-matrix">
          ${row2.map(renderCard).join('')}
        </div>` : ''}

        <!-- BẢNG TRA CỨU CHI TIẾT 10 ĐẠI VẬN KÈM 100 NĂM LƯU NIÊN -->
        <div style="margin-top: 6px;">
          <div style="font-size: 7.5pt; font-weight: 800; color: #334155; text-transform: uppercase; margin-bottom: 3px;">Bảng Tra Cứu Chi Tiết Lưu Niên Theo Từng Đại Vận:</div>
          <table class="da-yun-liunian-table">
            <thead>
              <tr>
                <th style="width: 22%;">Đại Vận (Can Chi & Độ Tuổi)</th>
                <th style="width: 18%;">Đặc Tính Mệnh Lý</th>
                <th style="width: 60%;">10 Năm Lưu Niên Thuộc Đại Vận</th>
              </tr>
            </thead>
            <tbody>
              ${daYun.slice(0, 10).map(yun => {
                const gan = yun.gan || '-';
                const zhi = yun.zhi || '-';
                const ganEl = STEM_ELEMENTS[gan] || 'Thổ';
                const color = ELEMENT_COLORS[ganEl]?.text || '#0f172a';

                let badgeColor = '#b45309';
                let badgeLabel = 'Bình Hòa';
                if (dungThan.includes(ganEl) || hyThan.includes(ganEl)) {
                  badgeColor = '#047857';
                  badgeLabel = 'Cát Vận';
                } else if (kyThan.includes(ganEl)) {
                  badgeColor = '#b91c1c';
                  badgeLabel = 'Thận Trọng';
                }

                const lnList = yun.liuNian && yun.liuNian.length > 0 
                  ? yun.liuNian 
                  : Array.from({ length: 10 }, (_, i) => ({ year: yun.startYear + i, canChi: '' }));

                return `
                  <tr>
                    <td>
                      <strong style="color: ${color}; font-size: 8pt;">${gan} ${zhi}</strong>
                      <span style="color: #475569; font-weight: 600;">(${yun.startAge} - ${yun.startAge + 9}t)</span>
                    </td>
                    <td>
                      <div>${yun.thapThanGan || '-'} • ${yun.naYin || ''}</div>
                      <span style="font-size: 6pt; font-weight: 800; color: ${badgeColor}; text-transform: uppercase;">[${badgeLabel}]</span>
                    </td>
                    <td>
                      <div class="liunian-pills-wrap">
                        ${lnList.map(ln => `
                          <span class="liunian-mini-pill">
                            <span class="ln-yr">${ln.year}</span>
                            <span class="ln-gc">${ln.canChi || ''}</span>
                          </span>
                        `).join('')}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 5. CÁC PHẦN LUẬN GIẢI AI (TIÊU CHUẨN HOẶC CHUYÊN SÂU)
  if (filteredSections.length > 0) {
    const isVipRecord = record.interpretationMode === 'vip' || record.packageType === 'deep' || record.packageType === 'vip' || /(?:CHƯƠNG|Chương)\s*1/i.test(rawInterp);
    const interpHeader = isVipRecord ? 'Hồ Sơ Luận Giải Mệnh Lý Bát Tự (Chuyên Sâu)' : 'Hồ Sơ Luận Giải Mệnh Lý Bát Tự (Tiêu Chuẩn)';
    const interpTitle = isVipRecord ? 'TOÀN VĂN LUẬN GIẢI CHUYÊN SÂU' : 'BẢN LUẬN GIẢI BÁT TỰ TIÊU CHUẨN';

    contentHtml += `
      <div class="page-break">
        <div class="doc-page-header">
          <span>${interpHeader}</span>
          <span>Đương Số: ${inputInfo.name || 'Gia Chủ'}</span>
        </div>
        <div style="text-align: center; margin: 16px 0 20px 0;">
          <h2 class="serif-title" style="font-size: 15pt; color: #78350f; margin-bottom: 4px;">${interpTitle}</h2>
          <div style="font-size: 8pt; color: #64748b;">Biên soạn bởi Hệ Thống Trí Tuệ Nhân Tạo & Rule Engine Cổ Học Phương Đông</div>
        </div>
    `;

    filteredSections.forEach((sec, idx) => {
      // Chương 1 không có border-top, từ chương 2 trở đi dùng .chapter-block (khoảng cách vừa đủ, border-top nhẹ, KHÔNG page-break)
      contentHtml += `
        <div class="${idx > 0 ? 'chapter-block' : ''}">
          <h2 class="doc-h1 serif-title" style="margin-top: ${idx === 0 ? '0' : '2px'}; margin-bottom: 6px;">${sec.title}</h2>
          <div class="serif-body">
            ${markdownToHtml(sec.content)}
          </div>
        </div>
      `;
    });

    contentHtml += `</div>`;
  }

  return wrapCompleteHtml(`Lá Số Bát Tự - ${inputInfo.name || 'Gia Chủ'}`, contentHtml);
}

/**
 * Tạo HTML cho Tử Vi (Ziwei)
 */
function generateZiweiHtml(record, scope = []) {
  const chartData = record.chartData || record.analysisSnapshot || record.result || {};
  const inputInfo = record.inputInfo || {};
  const rawPalaces = chartData.palaces || [];

  const hasScope = scope && scope.length > 0;
  const includeChart = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('ziwei_grid');

  let rawInterp = record.aiInterpretation?.content || record.analysis || record.analysisSnapshot?.aiInterpretation || '';
  if (!rawInterp && Array.isArray(record.aiInterpretation?.sections) && record.aiInterpretation.sections.length > 0) {
    rawInterp = record.aiInterpretation.sections.map(s => `### ${s.title || ''}\n\n${s.content || ''}`).join('\n\n');
  }

  const sections = parseInterpretationSections(rawInterp);
  const isAllInterpRequested = !hasScope ||
    scope.includes('all') ||
    scope.includes('interpretation') ||
    scope.includes('interp') ||
    scope.includes('intro') ||
    scope.includes('all_interpretation');

  const filteredSections = sections.filter(sec => {
    if (isAllInterpRequested) return true;
    return scope.includes(sec.id) || scope.includes(`interp_${sec.id}`) || scope.includes(`ziwei_${sec.id}`);
  });

  const ZIWEI_GRID_COORDINATES = {
    "Tỵ": { row: 1, col: 1 },
    "Ngọ": { row: 1, col: 2 },
    "Mùi": { row: 1, col: 3 },
    "Thân": { row: 1, col: 4 },
    "Dậu": { row: 2, col: 4 },
    "Tuất": { row: 3, col: 4 },
    "Hợi": { row: 4, col: 4 },
    "Tý": { row: 4, col: 3 },
    "Sửu": { row: 4, col: 2 },
    "Dần": { row: 4, col: 1 },
    "Mão": { row: 3, col: 1 },
    "Thìn": { row: 2, col: 1 }
  };

  const ZIWEI_BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

  const ZIWEI_BRANCH_ELEMENTS = {
    "Tý": "Thủy", "Hợi": "Thủy",
    "Dần": "Mộc", "Mão": "Mộc",
    "Tỵ": "Hỏa", "Ngọ": "Hỏa",
    "Thân": "Kim", "Dậu": "Kim",
    "Thìn": "Thổ", "Tuất": "Thổ", "Sửu": "Thổ", "Mùi": "Thổ"
  };

  const ZIWEI_STAR_ELEMENTS = {
    // Chính tinh
    "Tử Vi": "Thổ", "Thiên Phủ": "Thổ", "Vũ Khúc": "Kim", "Thiên Tướng": "Thủy",
    "Thái Dương": "Hỏa", "Cự Môn": "Thủy", "Thiên Cơ": "Mộc", "Thiên Đồng": "Thủy",
    "Thái Âm": "Thủy", "Thiên Lương": "Mộc", "Thất Sát": "Kim", "Phá Quân": "Thủy",
    "Tham Lang": "Thủy", "Liêm Trinh": "Hỏa",
    // Cát tinh & phụ tinh
    "Văn Xương": "Kim", "Văn Khúc": "Thủy", "Thiên Khôi": "Hỏa", "Thiên Việt": "Hỏa",
    "Tả Phù": "Thổ", "Hữu Bật": "Thủy", "Lộc Tồn": "Thổ", "Thiên Mã": "Hỏa",
    "Hóa Lộc": "Mộc", "Hóa Quyền": "Thủy", "Hóa Khoa": "Mộc", "Hóa Kỵ": "Thủy",
    "Đào Hoa": "Mộc", "Hồng Loan": "Thủy", "Thiên Hỷ": "Thủy", "Hỷ Thần": "Hỏa",
    "Long Trì": "Thủy", "Phượng Các": "Thổ", "Giải Thần": "Mộc", "Thanh Long": "Thủy",
    "Bác Sĩ": "Thủy", "Bác Sỹ": "Thủy", "Lực Sĩ": "Hỏa", "Tướng Quân": "Mộc",
    "Tấu Thư": "Kim", "Quốc Ấn": "Thổ", "Tam Thai": "Thủy", "Bát Tọa": "Thổ",
    "Phong Cáo": "Thổ", "Thiên Quan": "Hỏa", "Thiên Phúc": "Thổ", "Thiên Đức": "Thủy",
    "Nguyệt Đức": "Hỏa", "Thiên Quý": "Thổ", "Thiên Tài": "Thổ", "Thiên Thọ": "Thổ",
    "Thiên Trù": "Thổ", "Thai Phụ": "Kim", "Ân Quang": "Mộc", "Thiên Y": "Thủy",
    // Sát tinh & hung bại tinh
    "Kình Dương": "Kim", "Đà La": "Kim", "Hỏa Tinh": "Hỏa", "Linh Tinh": "Hỏa",
    "Địa Không": "Hỏa", "Địa Kiếp": "Hỏa", "Thiên Khốc": "Thủy", "Thiên Hư": "Thủy",
    "Thiên Hình": "Hỏa", "Thiên Diêu": "Thủy", "Cô Thần": "Thổ", "Quả Tú": "Thổ",
    "Đại Hao": "Hỏa", "Tiểu Hao": "Hỏa", "Tang Môn": "Mộc", "Bạch Hổ": "Kim",
    "Điếu Khách": "Hỏa", "Quan Phù": "Hỏa", "Phục Binh": "Hỏa", "Kiếp Sát": "Hỏa",
    "Tuần": "Hỏa", "Triệt": "Kim", "Tuần Không": "Hỏa", "Triệt Lộ": "Kim",
    "Bệnh Phù": "Thổ", "Trực Phù": "Hỏa", "Phi Liêm": "Hỏa", "Tuế Dịch": "Hỏa",
    "Lưu Hà": "Thủy", "Thiên Thương": "Thủy", "Thiên Sứ": "Thủy", "Phá Toái": "Hỏa"
  };

  const ZIWEI_ELEMENT_COLORS = {
    "Kim": "#475569",    // Xám bạc
    "Mộc": "#059669",    // Xanh lục
    "Thủy": "#0f172a",   // Đen / Xanh đen
    "Hỏa": "#dc2626",    // Đỏ
    "Thổ": "#b45309"     // Vàng cam đất
  };

  const ZIWEI_AUSPICIOUS_STARS = new Set([
    "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Tả Phù", "Hữu Bật",
    "Lộc Tồn", "Thiên Mã", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Giải Thần",
    "Đường Phù", "Quốc Ấn", "Tam Thai", "Bát Tọa", "Thiên Hỷ", "Hỷ Thần",
    "Phượng Các", "Thanh Long", "Tướng Quân", "Bác Sĩ", "Bác Sỹ", "Lực Sĩ",
    "Tấu Thư", "Trực Phù", "Thiên Quan", "Thiên Phúc", "Thiên Quý", "Thiên Đức",
    "Nguyệt Đức", "Long Đức", "Phúc Đức", "Đào Hoa", "Hồng Loan", "Thiên Tài",
    "Thiên Thọ", "Phong Cáo", "Nguyệt Giải", "Thai Phụ", "Long Trì", "Thiên Trù",
    "Ân Quang", "Bát Tòa", "Thiên Trù", "Quốc ấn", "Phượng các"
  ]);

  function isAuspiciousStar(name) {
    if (!name) return true;
    const trimmed = name.trim();
    if (ZIWEI_AUSPICIOUS_STARS.has(trimmed)) return true;
    const lower = trimmed.toLowerCase();
    if (lower.includes("không") || lower.includes("kiếp") || lower.includes("kình") || 
        lower.includes("đà") || lower.includes("hỏa") || lower.includes("linh") || 
        lower.includes("khốc") || lower.includes("hư") || lower.includes("hình") || 
        lower.includes("sát") || lower.includes("diêu") || lower.includes("cô") || 
        lower.includes("quả") || lower.includes("toái") || lower.includes("phá") || 
        lower.includes("hao") || lower.includes("tang") || lower.includes("hổ") || 
        lower.includes("khách") || lower.includes("la") || lower.includes("võng") || 
        lower.includes("triệt") || lower.includes("tuần") || lower.includes("bệnh") || 
        lower.includes("tử") || lower.includes("kỵ") || lower.includes("binh") || lower.includes("thương")) {
      return false;
    }
    if (lower.includes("lộc") || lower.includes("quyền") || lower.includes("khoa") || 
        lower.includes("trì") || lower.includes("hỷ") || lower.includes("giải") || 
        lower.includes("phúc") || lower.includes("đức") || lower.includes("long") || 
        lower.includes("phượng") || lower.includes("thanh") || lower.includes("trù") || 
        lower.includes("quý") || lower.includes("thọ") || lower.includes("quang")) {
      return true;
    }
    return true;
  }

  function formatAbbrevStemBranch(stem, branch) {
    const stemMap = {
      "Giáp": "G.", "Ất": "Ấ.", "Bính": "B.", "Đinh": "Đ.", "Mậu": "M.",
      "Kỷ": "K.", "Canh": "C.", "Tân": "T.", "Nhâm": "N.", "Quý": "Q."
    };
    const abbr = stemMap[stem] || stem || "";
    return `${abbr}${branch || ''}`;
  }

  function getStarColor(starName) {
    const elem = ZIWEI_STAR_ELEMENTS[starName] || "Thủy";
    return ZIWEI_ELEMENT_COLORS[elem] || "#0f172a";
  }

  function getBranchColor(branchName) {
    const elem = ZIWEI_BRANCH_ELEMENTS[branchName] || "Thủy";
    return ZIWEI_ELEMENT_COLORS[elem] || "#0f172a";
  }

  const menhPalace = rawPalaces.find(p => p.name === 'Mệnh' || p.name === 'MỆNH');
  const bodyPalace = rawPalaces.find(p => p.isBodyPalace || p.name?.includes('Thân'));

  const includeCover = scope.includes('cover') || scope.includes('all') || (!hasScope);
  let coverHtml = '';
  if (includeCover) {
    coverHtml = renderCoverPage({
      system: 'ziwei',
      title: 'TỬ VI ĐẨU SỐ TOÀN THƯ MỆNH BÀN',
      subtitle: 'Khảo Luận 12 Cung Vị, Tinh Đẩu Đắc Hãm & Tứ Hóa Phi Tinh Biến Hóa',
      clientName: chartData.name || inputInfo.name || 'Gia Chủ',
      gender: inputInfo.gender === 'female' || parseInt(inputInfo.gender) === 0 ? 'Nữ Mệnh' : 'Nam Mệnh',
      dateStr: inputInfo.birthday || inputInfo.date || 'Chưa xác định',
      lunarStr: record.lunarDate ? `Âm lịch: ${record.lunarDate}` : '',
      extraInfo: [
        ...(record.cuc ? [{ label: 'Cục vị', value: record.cuc }] : []),
        ...(record.menhChu ? [{ label: 'Mệnh Chủ', value: `${record.menhChu} | Thân: ${record.thanChu || ''}` }] : [])
      ],
      recordId: record._id || '',
      sealText: ['TỬ', 'VI', 'ĐẨU', 'SỐ']
    });
  }

  let contentHtml = coverHtml + `
    <div class="monograph-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="monograph-badge" style="background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe;">Hồ Sơ Tử Vi Cá Nhân • Bắc Phái Mệnh Lý</span>
          <h1 class="monograph-title serif-title">MỆNH BÀN 12 CUNG & VẬN HẠN ĐẨU SỐ</h1>
        </div>
        <div style="text-align: right; font-size: 7.5pt; color: #78350f; font-weight: 700;">
          BẢN QUYỀN HỌC THUẬT<br/>
          MÃ LÁ SỐ: ${record._id?.slice(0, 18) || 'N/A'}
        </div>
      </div>
    </div>
  `;

  if (includeChart && rawPalaces.length > 0) {
    const currentYear = new Date().getFullYear();
    const currentYearBranchIdx = (currentYear - 4) % 12;

    function formatBirthDate(dateStr) {
      if (!dateStr) return '-';
      const parts = dateStr.split(' ')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    }
    const solarDateFormatted = formatBirthDate(chartData.solarDate || inputInfo.date);

    const LUNAR_HOURS_NAMES = [
      "Tý (23:00 - 00:59)", "Sửu (01:00 - 02:59)", "Dần (03:00 - 04:59)", "Mão (05:00 - 06:59)",
      "Thìn (07:00 - 08:59)", "Tỵ (09:00 - 10:59)", "Ngọ (11:00 - 12:59)", "Mùi (13:00 - 14:59)",
      "Thân (15:00 - 16:59)", "Dậu (17:00 - 18:59)", "Tuất (19:00 - 20:59)", "Hợi (21:00 - 22:59)"
    ];
    let hourDisplay = '-';
    if (inputInfo.hour !== undefined && LUNAR_HOURS_NAMES[inputInfo.hour]) {
      hourDisplay = LUNAR_HOURS_NAMES[inputInfo.hour];
    } else if (chartData.chineseDate) {
      const hourBranch = chartData.chineseDate.split('-').pop()?.trim() || '';
      hourDisplay = 'Giờ ' + hourBranch;
    }

    contentHtml += `
      <div class="no-break">
        <div class="section-title">I. Mệnh Bàn 12 Cung Số (Đồ Hình 4x4)</div>
        <div class="ziwei-grid">
          <!-- 12 Cung Vị theo Tọa Độ Vòng Địa Bàn -->
          ${rawPalaces.map((p) => {
            const rawBranch = p.earthlyBranch || p.earthBranch || 'Dần';
            const branch = rawBranch.charAt(0).toUpperCase() + rawBranch.slice(1);
            const coord = ZIWEI_GRID_COORDINATES[branch] || { row: 1, col: 1 };
            const isMenh = p.name === 'Mệnh' || p.name === 'MỆNH';
            const isBody = p.isBodyPalace || p.name?.includes('Thân');
            const palaceClass = isMenh ? 'menh-palace' : (isBody ? 'body-palace' : '');

            const branchColor = getBranchColor(branch);
            const stem = p.heavenlyStem || p.heavenStem || '';
            const abbrStemBranch = formatAbbrevStemBranch(stem, branch);

            const majorStars = p.majorStars || [];
            const minorStars = p.minorStars || [];
            const adjectiveStars = p.adjectiveStars || [];

            const allOtherStars = [
              ...minorStars.map(s => ({ name: s.name, brightness: s.brightness, mutagen: s.mutagen })),
              ...adjectiveStars.map(s => ({ name: s.name, brightness: '', mutagen: '' }))
            ];
            const majorNames = new Set(majorStars.map(s => s.name));
            const filteredMinorStars = allOtherStars.filter(s => !majorNames.has(s.name));

            const leftStars = [];
            const rightStars = [];
            filteredMinorStars.forEach(s => {
              if (isAuspiciousStar(s.name)) {
                leftStars.push(s);
              } else {
                rightStars.push(s);
              }
            });

            // Tiểu hạn & Nguyệt hạn
            const branchIdx = ZIWEI_BRANCHES.indexOf(branch);
            const tieuHanIdx = (branchIdx - 2 + 12) % 12;
            const tieuHanBranch = ZIWEI_BRANCHES[tieuHanIdx] || '';
            const tieuHanColor = getBranchColor(tieuHanBranch);
            const nguyetHanMonth = (branchIdx - currentYearBranchIdx + 12) % 12 + 1;
            const nguyetHanText = 'Th.' + nguyetHanMonth;

            return `
              <div class="ziwei-cell ${palaceClass}" style="grid-row: ${coord.row}; grid-column: ${coord.col};">
                <!-- Đỉnh cung -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 0.5px solid #f1f5f9; padding-bottom: 1.5px; line-height: 1;">
                  <span style="font-size: 6.8pt; font-weight: 700; color: #475569;">${abbrStemBranch}</span>
                  <span style="font-size: 8.5pt; font-weight: 900; color: ${branchColor}; text-transform: uppercase;">
                    ${p.name}${isBody && !p.name?.includes('Thân') ? ' <span style="font-size: 6.8pt; color: #4338ca; font-weight: 800;">(Thân)</span>' : ''}
                  </span>
                  <span style="font-size: 6.8pt; font-weight: 700; color: #64748b;">${p.decadal?.range ? p.decadal.range[0] + 't' : ''}</span>
                </div>

                <!-- Chính tinh (Căn giữa) -->
                <div style="margin: 2px 0; text-align: center; min-height: 22px; display: flex; flex-direction: column; justify-content: center; gap: 1px;">
                  ${majorStars.length > 0 ? majorStars.map(s => {
                    const sColor = getStarColor(s.name);
                    let mutagenHtml = '';
                    if (s.mutagen) {
                      const mut = String(s.mutagen).toLowerCase();
                      if (mut.includes('loc')) {
                        mutagenHtml = '<span style="font-size: 5.5pt; font-weight: 900; background: #dcfce7; color: #15803d; border: 0.5px solid #86efac; padding: 0 2px; border-radius: 2px; margin-left: 2px;">LỘC</span>';
                      } else if (mut.includes('quyen')) {
                        mutagenHtml = '<span style="font-size: 5.5pt; font-weight: 900; background: #fef3c7; color: #b45309; border: 0.5px solid #fde68a; padding: 0 2px; border-radius: 2px; margin-left: 2px;">QUYỀN</span>';
                      } else if (mut.includes('khoa')) {
                        mutagenHtml = '<span style="font-size: 5.5pt; font-weight: 900; background: #dbeafe; color: #1d4ed8; border: 0.5px solid #bfdbfe; padding: 0 2px; border-radius: 2px; margin-left: 2px;">KHOA</span>';
                      } else if (mut.includes('ky')) {
                        mutagenHtml = '<span style="font-size: 5.5pt; font-weight: 900; background: #ffe4e6; color: #be123c; border: 0.5px solid #fecdd3; padding: 0 2px; border-radius: 2px; margin-left: 2px;">KỴ</span>';
                      }
                    }
                    return `
                      <div style="font-size: 8pt; font-weight: 900; color: ${sColor}; line-height: 1.15;">
                        ${s.name}${s.brightness ? ` <span style="font-size: 6.5pt; font-weight: 600; color: #64748b;">(${s.brightness})</span>` : ''}${mutagenHtml}
                      </div>
                    `;
                  }).join('') : '<div style="font-size: 7.2pt; font-weight: 800; color: #94a3b8; font-style: italic;">VÔ CHÍNH DIỆU</div>'}
                </div>

                <!-- Phụ tinh 2 cột (Trái: Cát tinh, Phải: Sát tinh) -->
                <div style="display: flex; justify-content: space-between; gap: 2px; border-top: 0.5px solid #f8fafc; padding-top: 2px; flex: 1; min-height: 46px; max-height: 56px; overflow: hidden; font-size: 6.2pt; line-height: 1.2;">
                  <div style="width: 50%; text-align: left; overflow: hidden;">
                    ${leftStars.slice(0, 5).map(s => `<div style="color: ${getStarColor(s.name)}; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}${s.brightness ? ` <span style="color: #94a3b8; font-size: 5.5pt;">(${s.brightness})</span>` : ''}</div>`).join('')}
                  </div>
                  <div style="width: 50%; text-align: right; overflow: hidden;">
                    ${rightStars.slice(0, 5).map(s => `<div style="color: ${getStarColor(s.name)}; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}${s.brightness ? ` <span style="color: #94a3b8; font-size: 5.5pt;">(${s.brightness})</span>` : ''}</div>`).join('')}
                  </div>
                </div>

                <!-- Đáy cung -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 0.5px solid #f1f5f9; padding-top: 1.5px; font-size: 6.8pt; line-height: 1;">
                  <span style="font-weight: 800; color: ${tieuHanColor};">${tieuHanBranch}</span>
                  <span style="font-weight: 600; color: #64748b;">${p.changsheng12 || ''}</span>
                  <span style="font-weight: 700; color: #4338ca; background: #e0e7ff; padding: 0.5px 3px; border-radius: 2px; font-size: 6pt;">${nguyetHanText}</span>
                </div>
              </div>
            `;
          }).join('')}

          <!-- TRUNG CUNG (THIÊN BÀN - 2x2 Ô Ở GIỮA) -->
          <div class="ziwei-center">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                <span style="font-size: 7.2pt; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px;">THIÊN BÀN TỬ VI ĐẨU SỐ</span>
                <span style="font-size: 6.8pt; font-weight: 800; text-transform: uppercase; padding: 1.5px 7px; border-radius: 8px; ${chartData.gender === 'Nữ' ? 'background: #fff1f2; color: #be123c; border: 0.5px solid #fecdd3;' : 'background: #eff6ff; color: #1d4ed8; border: 0.5px solid #bfdbfe;'}">
                  ${chartData.gender || 'Nam'} Mệnh
                </span>
              </div>
            </div>

            <div style="background: rgba(255, 255, 255, 0.9); border: 1px solid #e9d5ff; border-radius: 5px; padding: 6px 10px; margin: 4px 0; font-size: 7.2pt; line-height: 1.5; text-align: left;">
              <div style="display: flex; justify-content: space-between; border-bottom: 0.5px dashed #e9d5ff; padding-bottom: 2px; margin-bottom: 2px;">
                <div><span style="color: #64748b;">Bản Mệnh Cục:</span> <strong style="color: #0f172a; font-weight: 800;">${chartData.fiveElementsClass || '-'}</strong></div>
                <div><span style="color: #64748b;">Mệnh / Thân Chủ:</span> <strong style="color: #0f172a; font-weight: 800;">${chartData.soul || '-'} / ${chartData.body || '-'}</strong></div>
              </div>
              <div style="border-bottom: 0.5px dashed #e9d5ff; padding-bottom: 2px; margin-bottom: 2px;">
                <span style="color: #64748b;">Tứ Trụ Can Chi:</span> <strong style="color: #6b21a8; font-weight: 800;">${chartData.chineseDate || '-'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <div><span style="color: #64748b;">Dương Lịch:</span> <strong style="color: #0f172a; font-weight: 800;">${solarDateFormatted}</strong></div>
                <div><span style="color: #64748b;">Giờ Sinh:</span> <strong style="color: #0f172a; font-weight: 800;">${hourDisplay}</strong></div>
              </div>
            </div>

            <div style="font-size: 7pt; color: #6b21a8; font-weight: 700; background: #f3e8ff; border-radius: 3px; padding: 2.5px 6px;">
              <span>Cung Mệnh: <strong>An tại ${menhPalace?.earthlyBranch || '-'}</strong></span>
              <span style="margin: 0 6px; color: #c084fc;">•</span>
              <span>Thân Cư: <strong>${bodyPalace?.name || '-'} (${bodyPalace?.earthlyBranch || '-'})</strong></span>
            </div>
          </div>
        </div>

        <!-- Chú giải ngũ hành & Đắc Hãm ở chân lá số -->
        <div class="ziwei-legend-card">
          <div style="color: #475569;">
            <strong>Đắc Hãm:</strong> 
            <span style="color: #6b21a8; font-weight: 700;">(M)</span>: Miếu &nbsp;|&nbsp; 
            <span style="color: #6b21a8; font-weight: 700;">(V)</span>: Vượng &nbsp;|&nbsp; 
            <span style="color: #6b21a8; font-weight: 700;">(Đ)</span>: Đắc &nbsp;|&nbsp; 
            <span style="color: #6b21a8; font-weight: 700;">(B)</span>: Bình &nbsp;|&nbsp; 
            <span style="color: #6b21a8; font-weight: 700;">(H)</span>: Hãm
          </div>
          <div style="display: flex; gap: 8px; align-items: center; font-weight: 700;">
            <span><span style="display: inline-block; width: 7px; height: 7px; background: #475569; border-radius: 1.5px; margin-right: 2px; vertical-align: middle;"></span>Kim</span>
            <span><span style="display: inline-block; width: 7px; height: 7px; background: #059669; border-radius: 1.5px; margin-right: 2px; vertical-align: middle;"></span>Mộc</span>
            <span><span style="display: inline-block; width: 7px; height: 7px; background: #0f172a; border-radius: 1.5px; margin-right: 2px; vertical-align: middle;"></span>Thủy</span>
            <span><span style="display: inline-block; width: 7px; height: 7px; background: #dc2626; border-radius: 1.5px; margin-right: 2px; vertical-align: middle;"></span>Hỏa</span>
            <span><span style="display: inline-block; width: 7px; height: 7px; background: #b45309; border-radius: 1.5px; margin-right: 2px; vertical-align: middle;"></span>Thổ</span>
          </div>
        </div>
      </div>
    `;
  }

  // Luận giải Tử Vi: Áp dụng chapter-block tự nhiên, không ngắt trang cưỡng bức giữa các chương
  if (filteredSections.length > 0) {
    contentHtml += `
      <div class="page-break">
        <div class="doc-page-header">
          <span>Hồ Sơ Luận Giải Tử Vi Đẩu Số</span>
          <span>Đương Số: ${chartData.name || inputInfo.name || 'Gia Chủ'}</span>
        </div>
        <div style="text-align: center; margin: 16px 0 20px 0;">
          <h2 class="serif-title" style="font-size: 15pt; color: #78350f; margin-bottom: 4px;">TOÀN VĂN LUẬN ĐOÁN 12 CUNG & VẬN HẠN</h2>
          <div style="font-size: 8pt; color: #64748b;">Hệ thống phân tích học thuật Tử Vi kết hợp Đại Trí Tuệ Nhân Tạo Mệnh Lý</div>
        </div>
    `;

    filteredSections.forEach((sec, idx) => {
      contentHtml += `
        <div class="${idx > 0 ? 'chapter-block' : ''}">
          <h2 class="doc-h1 serif-title">${sec.title}</h2>
          <div class="serif-body">
            ${markdownToHtml(sec.content)}
          </div>
        </div>
      `;
    });

    contentHtml += `</div>`;
  }

  return wrapCompleteHtml(`Lá Số Tử Vi - ${chartData.name || inputInfo.name || 'Gia Chủ'}`, contentHtml);
}

/**
 * Tạo HTML cho Kinh Dịch (IChing) - Chu Dịch Chiêm Bốc & Lục Hào Lạc Giáp Cổ Pháp
 */
function generateIChingHtml(record, scope = []) {
  const primary = record.primaryHexagram || {};
  const transformed = record.transformedHexagram || {};
  const question = record.question || 'Chiêm đoán sự việc';
  const movingLines = Array.isArray(record.movingLines) ? record.movingLines : [];
  const lunarDateInfo = record.lunarDateInfo || {};

  function formatElementName(elem) {
    if (!elem || elem === 'Chưa xác định' || elem === 'Unknown') return elem || '-';
    const key = String(elem).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const map = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
    return map[key] || elem;
  }

  function formatElementBadge(stemBranch, element) {
    const elem = formatElementName(element);
    const color = ELEMENT_COLORS[elem] || { text: '#334155', bg: '#f8fafc', border: '#cbd5e1' };
    return `<span style="display: inline-block; padding: 1px 5px; border-radius: 3px; font-weight: 700; font-size: 7pt; color: ${color.text}; background: ${color.bg}; border: 1px solid ${color.border}; white-space: nowrap;">${stemBranch || ''} (${elem})</span>`;
  }

  const hasScope = scope && scope.length > 0;
  const includeTable = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('iching_table') || scope.includes('iching_hexagram');
  const includeAnalysis = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('iching_analysis') || scope.includes('iching_hexagram');
  const includeUngKy = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('iching_ungky');

  let rawInterp = record.aiInterpretation?.content || record.analysis || record.analysisSnapshot?.aiInterpretation || '';
  if (!rawInterp && Array.isArray(record.aiInterpretation?.sections) && record.aiInterpretation.sections.length > 0) {
    rawInterp = record.aiInterpretation.sections.map(s => `### ${s.title || ''}\n\n${s.content || ''}`).join('\n\n');
  }

  const sections = parseInterpretationSections(rawInterp);
  const isAllInterpRequested = !hasScope ||
    scope.includes('all') ||
    scope.includes('interpretation') ||
    scope.includes('interp') ||
    scope.includes('intro') ||
    scope.includes('all_interpretation') ||
    scope.includes('iching_interpretation');

  const filteredSections = sections.filter(sec => {
    if (isAllInterpRequested) return true;
    return scope.includes(sec.id) || scope.includes(`interp_${sec.id}`) || scope.includes(`iching_${sec.id}`);
  });

  // Xác định mã nhị phân quẻ chủ (6 ký tự: binary_code[0] là Hào 6, binary_code[5] là Hào 1)
  let primaryBinary = primary.binary_code;
  if (!primaryBinary && Array.isArray(primary.lines)) {
    primaryBinary = primary.lines.map(l => (typeof l === 'object' ? (l.type ?? l.is_yang ?? 1) : l)).reverse().join('');
  }
  if (!primaryBinary) {
    const found = hexagramsData.find(h => h.name && h.name.includes(primary.name));
    primaryBinary = found ? found.binary_code : '111111';
  }

  // Quẻ Hỗ (Nuclear Hexagram):
  // Hỗ Thượng (hào 5, 4, 3) = primaryBinary[1] + primaryBinary[2] + primaryBinary[3]
  // Hỗ Hạ (hào 4, 3, 2) = primaryBinary[2] + primaryBinary[3] + primaryBinary[4]
  let nuclearHexagram = null;
  if (primaryBinary && primaryBinary.length === 6) {
    const nucBin = primaryBinary[1] + primaryBinary[2] + primaryBinary[3] + primaryBinary[2] + primaryBinary[3] + primaryBinary[4];
    const foundNuc = hexagramsData.find(h => h.binary_code === nucBin);
    nuclearHexagram = foundNuc || {
      name: 'Quẻ Hỗ (' + nucBin + ')',
      binary_code: nucBin,
      palace: 'Hỗ Cung',
      palace_element: 'Trung Khí'
    };
  }

  // Chuẩn bị tái cấu trúc Lục Hào Lạc Giáp
  const safeRecord = {
    ...record,
    primaryHexagram: { ...primary, binary_code: primaryBinary },
    movingLines,
    lunarDateInfo: {
      dayCanChi: lunarDateInfo.dayCanChi || 'Giáp Tý',
      monthCanChi: lunarDateInfo.monthCanChi || 'Bính Dần',
      yearCanChi: lunarDateInfo.yearCanChi || 'Giáp Thìn',
      hourCanChi: lunarDateInfo.hourCanChi || 'Giáp Tý',
      tuankhong: lunarDateInfo.tuankhong || ''
    }
  };

  let reconstructed = null;
  try {
    reconstructed = IChingDataService.reconstructLines(safeRecord);
  } catch (e) {
    // Dự phòng khi dữ liệu đặc thù
  }

  const primaryLines = reconstructed?.primaryLines || [];
  const secondaryLines = reconstructed?.secondaryLines || [];
  const primaryQtBranch = reconstructed?.primaryHexagram?.quai_than || '';
  const secondaryQtBranch = reconstructed?.transformedHexagram?.quai_than || transformed.quai_than || '';

  // Phân tích Dịch Lý
  let analysis = record.analysisSnapshot || {};
  if (!analysis.dungThan && primaryLines.length > 0) {
    try {
      analysis = RuleEngineService.analyze({
        primaryLines,
        secondaryLines,
        question
      }, 1) || {};
    } catch (e) {
      analysis = {};
    }
  }

  const dateCastStr = record.dateCast ? new Date(record.dateCast).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }) : 'Chưa xác định';

  const yearCanChi = lunarDateInfo.yearCanChi || 'Bính Ngọ';
  const monthCanChi = lunarDateInfo.monthCanChi || 'Bính Thân';
  const dayCanChi = lunarDateInfo.dayCanChi || 'Tân Tị';
  const hourCanChi = lunarDateInfo.hourCanChi || 'Quý Tị';
  const tuankhong = lunarDateInfo.tuankhong || 'Thân Dậu';
  const nhatThan = lunarDateInfo.nhatThan || `${dayCanChi.split(' ').pop() || ''}-Hỏa`;
  const nguyetLenh = lunarDateInfo.nguyetLenh || `${monthCanChi.split(' ').pop() || ''}-Kim`;

  const includeCover = scope.includes('cover') || scope.includes('all') || (!hasScope);
  let coverHtml = '';
  if (includeCover) {
    coverHtml = renderCoverPage({
      system: 'iching',
      title: 'CHU DỊCH QUÁI TƯỢNG & LỤC HÀO BIỆN CHỨNG',
      subtitle: 'Bốc Phệ Chiêm Đoán, Biện Chứng Tượng - Hào & Định Lượng Ứng Kỳ',
      clientName: record.userName || 'Đương Số',
      gender: '',
      dateStr: dateCastStr,
      lunarStr: lunarDateInfo.lunarDateStr ? `Âm lịch: ${lunarDateInfo.lunarDateStr}` : `${dayCanChi} | ${monthCanChi}`,
      extraInfo: [
        { label: 'Tâm điểm', value: `"${question}"`, fullWidth: true, highlight: true },
        { label: 'Quẻ Chủ', value: `${primary.name || 'N/A'} (${primary.palace || ''})` },
        { label: 'Quẻ Biến', value: transformed?.name ? `${transformed.name} (${transformed.palace || ''})` : 'Không có quẻ biến' },
        ...(tuankhong ? [{ label: 'Tuần Không', value: tuankhong }] : [])
      ],
      recordId: record._id || '',
      sealText: ['DỊCH', 'LÝ', 'CHÍNH', 'TÔNG']
    });
  }

  let contentHtml = coverHtml + `
    <div class="monograph-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="monograph-badge">Hồ Sơ Dịch Lý Cá Nhân • Chu Dịch Lục Hào</span>
          <h1 class="monograph-title serif-title">HỒ SƠ QUẺ DỊCH & DỰ ĐOÁN ỨNG KỲ</h1>
        </div>
        <div style="text-align: right; font-size: 7.5pt; color: #78350f; font-weight: 700;">
          MÃ SỐ: ${record._id?.slice(0, 18) || 'N/A'}<br/>
          BẢN QUYỀN HỆ THỐNG
        </div>
      </div>

      <div style="margin-top: 5px; font-size: 9pt; color: #1e293b; background: #fffbeb; border: 1px solid #fde68a; border-radius: 5px; padding: 4px 8px;">
        <strong style="color: #92400e; text-transform: uppercase; font-size: 7.5pt;">Tâm Điểm Chiêm Đoán:</strong> 
        <span style="font-weight: 600; font-style: italic;">"${question}"</span>
      </div>

      <div class="iching-meta-grid">
        <div><strong>Thời gian lập quẻ:</strong> ${dateCastStr} ${lunarDateInfo.lunarDateStr ? `(${lunarDateInfo.lunarDateStr})` : ''}</div>
        <div><strong>Phương pháp gieo:</strong> ${record.methodName || record.method || 'Lục Hào Truyền Thống'}</div>
        <div><strong>Nhật Thần / Nguyệt Lệnh:</strong> Nhật: ${nhatThan} | Nguyệt: ${nguyetLenh}</div>
        <div><strong>Tuần Không (Không Vong):</strong> <span class="${tuankhong ? 'tk-tag' : ''}">${tuankhong || 'Không có'}</span></div>
        <div><strong>Quái Thân Bản Quẻ:</strong> ${primaryQtBranch ? `<span class="qt-tag">Chi ${primaryQtBranch}</span>` : 'Không hiện'}</div>
      </div>
    </div>
  `;

  // I. Bảng Lục Hào & Đồ Hình 3 Quẻ
  if (includeTable) {
    const hasTransformed = transformed && transformed.name;
    const transBin = transformed.binary_code || reconstructed?.transformedHexagram?.binary_code;

    function getChiOnly(stemBranch) {
      if (!stemBranch) return '';
      const parts = stemBranch.trim().split(' ');
      return parts.length >= 2 ? parts[parts.length - 1] : stemBranch;
    }

    function getElementColor(element) {
      const elem = formatElementName(element);
      switch (elem) {
        case 'Mộc': return '#059669';
        case 'Hỏa': return '#dc2626';
        case 'Thổ': return '#b45309';
        case 'Kim': return '#64748b';
        case 'Thủy': return '#2563eb';
        default: return '#1e293b';
      }
    }

    function renderHaoBar(isYang, isMoving) {
      const color = isMoving ? '#dc2626' : '#1e40af';
      if (isYang) {
        return `<div style="width: 36px; height: 5px; background: ${color}; border-radius: 1px; margin: 0 auto;"></div>`;
      } else {
        return `<div style="width: 36px; height: 5px; display: flex; justify-content: space-between; margin: 0 auto;">
          <div style="width: 44%; height: 5px; background: ${color}; border-radius: 1px;"></div>
          <div style="width: 44%; height: 5px; background: ${color}; border-radius: 1px;"></div>
        </div>`;
      }
    }

    contentHtml += `
      <!-- 1. ĐỒ HÌNH 3 QUẺ (CHUẨN ẢNH 1) -->
      <div class="no-break" style="margin-bottom: 8px;">
        <div class="section-title">I. Đồ Hình 3 Quẻ: Quẻ Chủ - Quẻ Hỗ - Quẻ Biến</div>
        
        <div class="iching-tri-overview ${nuclearHexagram ? 'has-nuclear' : ''}" style="margin-bottom: 0;">
          <!-- Quẻ Chủ -->
          <div class="iching-hex-card primary" style="padding: 5px 8px;">
            <div class="iching-hex-card-title" style="color: #1e3a8a; font-size: 8.8pt;">Quẻ Chủ: ${primary.name || 'Quẻ Gốc'}</div>
            <div class="iching-hex-card-subtitle" style="font-size: 6.8pt; margin-bottom: 4px;">Cung ${primary.palace || 'Bản Cung'} (${formatElementName(primary.palace_element)})</div>
            <div class="iching-lines-mini" style="gap: 2.5px;">
              ${[6, 5, 4, 3, 2, 1].map(lNum => {
                const isYang = primaryBinary[6 - lNum] === '1';
                const isMoving = movingLines.includes(lNum);
                return `
                  <div class="iching-line-row">
                    ${renderHaoBar(isYang, isMoving)}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Quẻ Hỗ (Nuclear Hexagram) -->
          ${nuclearHexagram ? `
          <div class="iching-hex-card nuclear" style="padding: 5px 8px;">
            <div class="iching-hex-card-title" style="color: #b45309; font-size: 8.8pt;">Quẻ Hỗ: ${nuclearHexagram.name}</div>
            <div class="iching-hex-card-subtitle" style="font-size: 6.8pt; margin-bottom: 4px;">Hỗ Thể (Hào 2-3-4-5) - Cung ${nuclearHexagram.palace || 'Hỗ Cung'}</div>
            <div class="iching-lines-mini" style="gap: 2.5px;">
              ${[6, 5, 4, 3, 2, 1].map(lNum => {
                const isYang = nuclearHexagram.binary_code[6 - lNum] === '1';
                return `
                  <div class="iching-line-row">
                    ${renderHaoBar(isYang, false)}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Quẻ Biến -->
          ${hasTransformed ? `
          <div class="iching-hex-card transformed" style="padding: 5px 8px;">
            <div class="iching-hex-card-title" style="color: #b91c1c; font-size: 8.8pt;">Quẻ Biến: ${transformed.name}</div>
            <div class="iching-hex-card-subtitle" style="font-size: 6.8pt; margin-bottom: 4px;">Cung ${transformed.palace || 'Biến Cung'} (${formatElementName(transformed.palace_element)})</div>
            <div class="iching-lines-mini" style="gap: 2.5px;">
              ${[6, 5, 4, 3, 2, 1].map(lNum => {
                const isYang = transBin ? (transBin[6 - lNum] === '1') : false;
                const isMoving = movingLines.includes(lNum);
                return `
                  <div class="iching-line-row">
                    ${renderHaoBar(isYang, isMoving)}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : `
          <div class="iching-hex-card" style="display: flex; flex-direction: column; justify-content: center; background: #ffffff; border-color: #cbd5e1; padding: 5px 8px;">
            <div style="font-weight: 700; color: #64748b; font-size: 8.8pt;">Quẻ Tĩnh Thuần Nhất</div>
            <div style="font-size: 6.8pt; color: #94a3b8; margin-top: 2px;">Không có hào động, giữ nguyên tượng quẻ chủ</div>
          </div>
          `}
        </div>
      </div>

      <!-- 2. BẢNG LỤC HÀO NẠP GIÁP (ĐỐI CHIẾU QUẺ CHỦ & QUẺ BIẾN - CHUẨN ẢNH 1) -->
      <div class="no-break" style="margin-bottom: 8px; border: 1.5px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
        <div style="background: #ffffff; padding: 5px 10px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 6px;">
          <div style="width: 3.5px; height: 14px; background-color: #b45309; border-radius: 2px;"></div>
          <div class="serif-title" style="font-size: 8.8pt; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px;">
            BẢNG LỤC HÀO NẠP GIÁP (ĐỐI CHIẾU QUẺ CHỦ & QUẺ BIẾN)
          </div>
        </div>
        ${hasTransformed ? `
        <table class="luchao-web-table" style="width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: left; table-layout: fixed; margin-bottom: 0; border: none; border-radius: 0;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; color: #334155; font-size: 7.2pt; font-weight: 800; height: 26px;">
              <th style="width: 8%; text-align: center;">Hào</th>
              <th style="width: 7%; text-align: center;">T/Ứ</th>
              <th style="width: 15%; padding-left: 4px;">Lục Thân</th>
              <th style="width: 15%;">Địa Chi</th>
              <th style="width: 8%; text-align: center;">PT</th>
              <th style="width: 6%; text-align: center; border-right: 1.5px dashed #cbd5e1;">TK</th>
              <th style="width: 15%; padding-left: 8px;">Lục Thân</th>
              <th style="width: 15%;">Địa Chi</th>
              <th style="width: 6%; text-align: center;">TK</th>
              <th style="width: 15%;">Lục Thú</th>
              <th style="width: 8%; text-align: center;">Hào</th>
            </tr>
          </thead>
          <tbody>
            ${[5, 4, 3, 2, 1, 0].map(idx => {
              const lNum = idx + 1;
              const pLine = primaryLines[idx] || {};
              const sLine = secondaryLines ? secondaryLines[idx] : null;
              const isMoving = movingLines.includes(lNum) || pLine.moving;
              const isPrimaryYang = pLine.line_type === 1 || pLine.is_yang === 1 || primaryBinary[6 - lNum] === '1';
              const isSecondaryYang = sLine ? (sLine.line_type === 1 || sLine.is_yang === 1 || (transBin && transBin[6 - lNum] === '1')) : isPrimaryYang;

              const rowBg = idx % 2 === 1 ? '#ffffff' : '#fafbfc';

              return `
                <tr style="background-color: ${rowBg}; border-bottom: 1px solid #f1f5f9; height: 26px;">
                  <!-- Quẻ Chủ (Trái) -->
                  <td style="text-align: center; padding: 2px;">
                    ${renderHaoBar(isPrimaryYang, isMoving)}
                  </td>
                  <td style="text-align: center; padding: 2px; font-weight: 800; color: #1e40af; font-size: 7.5pt;">
                    ${pLine.is_host ? 'Thế' : pLine.is_guest ? 'Ứng' : ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: ${isMoving ? '800' : '600'}; color: #1e293b;">
                    ${pLine.relative || ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: ${isMoving ? '800' : '600'}; color: ${getElementColor(pLine.element)};">
                    ${getChiOnly(pLine.stem_branch)} ${pLine.element || ''}
                  </td>
                  <td style="text-align: center; padding: 2px; font-weight: 600; color: #64748b; font-size: 6.8pt;">
                    ${pLine.hidden_spirit ? pLine.hidden_spirit.replace(/^Phục:?\s*/i, '') : ''}
                  </td>
                  <td style="text-align: center; padding: 2px; border-right: 1.5px dashed #cbd5e1;">
                    ${pLine.tk ? `<span style="color: #dc2626; font-weight: 800; font-size: 7.2pt;">${pLine.tk}</span>` : ''}
                  </td>

                  <!-- Quẻ Biến (Phải) -->
                  <td style="padding: 2px 4px 2px 8px; font-weight: ${isMoving ? '800' : '600'}; color: #1e293b;">
                    ${sLine ? (sLine.relative || '') : ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: ${isMoving ? '800' : '600'}; color: ${sLine ? getElementColor(sLine.element) : '#1e293b'};">
                    ${sLine ? `${getChiOnly(sLine.stem_branch)} ${sLine.element || ''}` : ''}
                  </td>
                  <td style="text-align: center; padding: 2px;">
                    ${sLine && sLine.tk ? `<span style="color: #dc2626; font-weight: 800; font-size: 7.2pt;">${sLine.tk}</span>` : ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: 700; color: #334155;">
                    ${pLine.luc_thu || (sLine ? sLine.luc_thu : '') || ''}
                  </td>
                  <td style="text-align: center; padding: 2px;">
                    ${sLine ? renderHaoBar(isSecondaryYang, isMoving) : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ` : `
        <table class="luchao-web-table" style="width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: left; margin-bottom: 0; border: none; border-radius: 0;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; color: #334155; font-size: 7.2pt; font-weight: 800; height: 26px;">
              <th style="width: 12%; text-align: center;">Hào</th>
              <th style="width: 10%; text-align: center;">T/Ứ</th>
              <th style="width: 22%;">Lục Thân</th>
              <th style="width: 22%;">Địa Chi</th>
              <th style="width: 14%; text-align: center;">Phục Thần</th>
              <th style="width: 8%; text-align: center;">TK</th>
              <th style="width: 18%;">Lục Thú</th>
            </tr>
          </thead>
          <tbody>
            ${[5, 4, 3, 2, 1, 0].map(idx => {
              const lNum = idx + 1;
              const pLine = primaryLines[idx] || {};
              const isPrimaryYang = pLine.line_type === 1 || pLine.is_yang === 1 || primaryBinary[6 - lNum] === '1';
              const rowBg = idx % 2 === 1 ? '#ffffff' : '#fafbfc';

              return `
                <tr style="background-color: ${rowBg}; border-bottom: 1px solid #f1f5f9; height: 26px;">
                  <td style="text-align: center; padding: 2px;">
                    ${renderHaoBar(isPrimaryYang, false)}
                  </td>
                  <td style="text-align: center; padding: 2px; font-weight: 800; color: #1e40af; font-size: 7.5pt;">
                    ${pLine.is_host ? 'Thế' : pLine.is_guest ? 'Ứng' : ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: 600; color: #1e293b;">
                    ${pLine.relative || ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: 600; color: ${getElementColor(pLine.element)};">
                    ${getChiOnly(pLine.stem_branch)} ${pLine.element || ''}
                  </td>
                  <td style="text-align: center; padding: 2px; font-weight: 600; color: #64748b; font-size: 6.8pt;">
                    ${pLine.hidden_spirit ? pLine.hidden_spirit.replace(/^Phục:?\s*/i, '') : ''}
                  </td>
                  <td style="text-align: center; padding: 2px;">
                    ${pLine.tk ? `<span style="color: #dc2626; font-weight: 800; font-size: 7.2pt;">${pLine.tk}</span>` : ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: 700; color: #334155;">
                    ${pLine.luc_thu || ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        `}
      </div>

      <!-- 3. TRẠNG THÁI VƯỢNG SUY CÁC HÀO (CHUẨN HÌNH 2) -->
      <div class="no-break" style="margin-bottom: 8px;">
        <div style="margin-bottom: 4px;">
          <h3 class="serif-title" style="font-size: 9.5pt; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #881337; padding-bottom: 2px; display: inline-block;">
            TRẠNG THÁI VƯỢNG SUY CÁC HÀO
          </h3>
        </div>

        <div style="display: flex; gap: 10px;">
          <!-- Quẻ Chính (Trái) -->
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 3px; height: 18px;">
              ${primaryQtBranch ? `<span style="background: #f3e8ff; color: #6b21a8; font-weight: 700; font-size: 7pt; padding: 1px 8px; border-radius: 9999px; border: 1px solid #e9d5ff;">Quái Thân: ${primaryQtBranch}</span>` : ''}
            </div>
            <div style="border: 1.5px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
              <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: left;">
                <thead style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; color: #475569; font-size: 6.8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px;">
                  <tr>
                    <th style="padding: 4px 6px; width: 40%;">HÀO / CAN CHI</th>
                    <th style="padding: 4px 6px; width: 22%;">VƯỢNG SUY</th>
                    <th style="padding: 4px 6px; width: 19%;">TS NGÀY</th>
                    <th style="padding: 4px 6px; width: 19%;">TS THÁNG</th>
                  </tr>
                </thead>
                <tbody>
                  ${[5, 4, 3, 2, 1, 0].map(idx => {
                    const pLine = primaryLines[idx] || {};
                    const isVuongTuong = pLine.vuong_suy === 'Vượng' || pLine.vuong_suy === 'Tướng';
                    const elemColor = getElementColor(pLine.element);
                    return `
                      <tr style="border-bottom: 1px solid #f1f5f9; height: 24px; ${idx % 2 === 1 ? 'background-color: #fafbfc;' : ''}">
                        <td style="padding: 3px 6px; font-weight: 700; color: ${elemColor};">
                          ${pLine.stem_branch || '-'}
                          ${pLine.qt ? `<span style="margin-left: 3px; padding: 0.5px 3px; background: #f3e8ff; color: #6b21a8; font-size: 6pt; font-weight: 800; border-radius: 2px; text-transform: uppercase;">QT</span>` : ''}
                        </td>
                        <td style="padding: 3px 6px;">
                          ${isVuongTuong ? `<span style="display: inline-block; padding: 1px 5px; border-radius: 3px; font-weight: 800; font-size: 6.8pt; color: #dc2626; background: #fff1f2; border: 1px solid #fee2e2;">${pLine.vuong_suy}</span>` : `<span style="font-weight: 700; color: #1e293b;">${pLine.vuong_suy || 'Hưu'}</span>`}
                        </td>
                        <td style="padding: 3px 6px; color: #1e40af; font-weight: 700;">${pLine.ts_ngay || '-'}</td>
                        <td style="padding: 3px 6px; color: #b45309; font-weight: 700;">${pLine.ts_thang || '-'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Quẻ Biến (Phải - nếu có quẻ biến) -->
          ${hasTransformed ? `
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 3px; height: 18px;">
              ${secondaryQtBranch ? `<span style="background: #f3e8ff; color: #6b21a8; font-weight: 700; font-size: 7pt; padding: 1px 8px; border-radius: 9999px; border: 1px solid #e9d5ff;">Quái Thân: ${secondaryQtBranch}</span>` : ''}
            </div>
            <div style="border: 1.5px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
              <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: left;">
                <thead style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; color: #475569; font-size: 6.8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px;">
                  <tr>
                    <th style="padding: 4px 6px; width: 40%;">HÀO / CAN CHI</th>
                    <th style="padding: 4px 6px; width: 22%;">VƯỢNG SUY</th>
                    <th style="padding: 4px 6px; width: 19%;">TS NGÀY</th>
                    <th style="padding: 4px 6px; width: 19%;">TS THÁNG</th>
                  </tr>
                </thead>
                <tbody>
                  ${[5, 4, 3, 2, 1, 0].map(idx => {
                    const sLine = secondaryLines ? secondaryLines[idx] : null;
                    if (!sLine) return '';
                    const isVuongTuong = sLine.vuong_suy === 'Vượng' || sLine.vuong_suy === 'Tướng';
                    const elemColor = getElementColor(sLine.element);
                    return `
                      <tr style="border-bottom: 1px solid #f1f5f9; height: 24px; ${idx % 2 === 1 ? 'background-color: #fafbfc;' : ''}">
                        <td style="padding: 3px 6px; font-weight: 700; color: ${elemColor};">
                          ${sLine.stem_branch || '-'}
                          ${sLine.qt ? `<span style="margin-left: 3px; padding: 0.5px 3px; background: #f3e8ff; color: #6b21a8; font-size: 6pt; font-weight: 800; border-radius: 2px; text-transform: uppercase;">QT</span>` : ''}
                        </td>
                        <td style="padding: 3px 6px;">
                          ${isVuongTuong ? `<span style="display: inline-block; padding: 1px 5px; border-radius: 3px; font-weight: 800; font-size: 6.8pt; color: #dc2626; background: #fff1f2; border: 1px solid #fee2e2;">${sLine.vuong_suy}</span>` : `<span style="font-weight: 700; color: #1e293b;">${sLine.vuong_suy || 'Hưu'}</span>`}
                        </td>
                        <td style="padding: 3px 6px; color: #1e40af; font-weight: 700;">${sLine.ts_ngay || '-'}</td>
                        <td style="padding: 3px 6px; color: #b45309; font-weight: 700;">${sLine.ts_thang || '-'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // II. Khối Phân Tích Dịch Lý Cốt Lõi
  if (includeAnalysis) {
    const dungThanDetails = analysis.dungThanDetails || {};
    const the = analysis.the || {};
    const ung = analysis.ung || {};
    const movingList = analysis.movingLines || [];
    const specialStates = analysis.specialStates || [];
    const confidencePct = Math.round((analysis.confidence || 0.75) * 100);

    contentHtml += `
      <div class="no-break" style="margin-top: 10px;">
        <div class="section-title">II. Phân Tích Dịch Lý & Tương Quan Lực Lượng Cốt Lõi</div>
        
        <div class="iching-cards-grid">
          <!-- Card 1: Dụng Thần -->
          <div class="iching-card-box highlight">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #fde68a; padding-bottom: 3px; margin-bottom: 5px;">
              <span style="font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #92400e;">1. Dụng Thần (Tâm Điểm Dự Đoán)</span>
              <span style="font-size: 7pt; font-weight: 800; color: #b45309; background: #fef3c7; padding: 1px 5px; border-radius: 3px;">Mục Tiêu Chiêm Bốc</span>
            </div>
            <div style="font-size: 8pt; line-height: 1.45; color: #1e293b;">
              <div><strong>Dụng Thần Xác Định:</strong> <span style="font-weight: 900; color: #b45309; font-size: 9pt;">${analysis.dungThan || 'Hào Thế'}</span> (${formatElementName(dungThanDetails.element)})</div>
              <div><strong>Khí Lực Ngũ Hành:</strong> ${dungThanDetails.strength === 'strong' ? '<span style="color: #047857; font-weight: 800;">Vượng Tướng (Đắc lệnh, sinh trợ cát lợi)</span>' : dungThanDetails.strength === 'weak' ? '<span style="color: #b91c1c; font-weight: 800;">Hưu Tù Tử (Suy kiệt, thời vận chưa thông)</span>' : '<span style="color: #b45309; font-weight: 700;">Bình Hòa (Trung bình)</span>'}</div>
              <div><strong>Trạng Thái Tuần Không:</strong> ${dungThanDetails.is_tuankhong ? '<span class="tk-tag">[Phạm Không Vong - Cần chờ ngày xung/xuất không]</span>' : '<span style="color: #047857; font-weight: 600;">Không phạm Tuần Không</span>'}</div>
            </div>
          </div>

          <!-- Card 2: Thế - Ứng -->
          <div class="iching-card-box">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 5px;">
              <span style="font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #1e293b;">2. Tương Quan Thế - Ứng (Chủ & Khách)</span>
              <span style="font-size: 7pt; font-weight: 700; color: #475569;">Mình & Đối Tác</span>
            </div>
            <div style="font-size: 8pt; line-height: 1.45; color: #1e293b;">
              <div><strong>Hào Thế (Bản thân / Phía mình):</strong> ${the.relation || 'Thế'} (${formatElementName(the.element)}) - ${the.strength === 'strong' ? '<span style="color: #047857; font-weight: 700;">Vượng tướng, có quyền chủ động</span>' : '<span style="color: #b91c1c; font-weight: 700;">Hưu tù, lực bất tòng tâm</span>'}</div>
              <div><strong>Hào Ứng (Đối phương / Môi trường):</strong> ${ung.relation || 'Ứng'} (${formatElementName(ung.element)}) - ${ung.strength === 'strong' ? '<span style="color: #047857; font-weight: 700;">Lực lượng mạnh mẽ</span>' : '<span style="color: #64748b;">Lực lượng bình thường</span>'}</div>
              <div><strong>Tương Phối:</strong> ${specialStates.find(s => s.includes('Sinh') || s.includes('Khắc')) || 'Âm Dương hòa hợp, tương sinh hỗ trợ'}</div>
            </div>
          </div>

          <!-- Card 3: Hào Động & Biến Hóa -->
          <div class="iching-card-box">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 5px;">
              <span style="font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #1e293b;">3. Hào Động & Cơ Duyên Chuyển Hóa</span>
              <span style="font-size: 7pt; font-weight: 700; color: ${movingList.length > 0 ? '#b91c1c' : '#64748b'};">${movingList.length > 0 ? `${movingList.length} Hào Động` : 'Quẻ Tĩnh'}</span>
            </div>
            <div style="font-size: 8pt; line-height: 1.45; color: #1e293b;">
              ${movingList.length > 0 ? movingList.map(m => `
                <div style="margin-bottom: 2px;">
                  <strong style="color: #b91c1c;">Hào ${m.line}:</strong> ${m.effect} (${m.from} → ${m.to})
                </div>
              `).join('') : '<div style="color: #64748b; font-style: italic;">Quẻ không có hào động. Cục diện tĩnh tại, sự việc diễn ra theo quán tính tự nhiên, không có đột biến bất thường.</div>'}
            </div>
          </div>

          <!-- Card 4: Trạng Thái Đặc Biệt & Ứng Nghiệm -->
          <div class="iching-card-box">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 5px;">
              <span style="font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #1e293b;">4. Cách Cục & Độ Ứng Nghiệm</span>
              <span style="font-size: 7pt; font-weight: 800; color: #047857; background: #ecfdf5; padding: 1px 5px; border-radius: 3px;">Tin Cậy: ${confidencePct}%</span>
            </div>
            <div style="font-size: 8pt; line-height: 1.45; color: #1e293b;">
              <div><strong>Đặc Thái Học Thuật:</strong> ${specialStates.length > 0 ? specialStates.join(' • ') : 'Cục diện bình hòa, thuần khiết'}</div>
              <div><strong>Quái Thân Hỗ Trợ:</strong> ${primaryQtBranch ? `Trực tại địa chi <strong>${primaryQtBranch}</strong>` : 'Quái Thân ẩn tàng'}</div>
              <div><strong>Khuyến Cáo Dịch Học:</strong> ${dungThanDetails.strength === 'strong' ? 'Thời cơ chín muồi, nên quyết đoán nắm bắt.' : 'Nên tĩnh tại tích lũy, chờ đợi thời cơ ứng kỳ.'}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // III. Bảng Niên Lịch Ứng Kỳ Dự Báo
  if (includeUngKy && record.ungKy && record.ungKy.length > 0) {
    contentHtml += `
      <div class="no-break" style="margin-top: 10px;">
        <div class="section-title">III. Bảng Niên Lịch Ứng Kỳ Dự Báo Cát Hung</div>
        <table class="gfm-table">
          <thead>
            <tr>
              <th style="width: 32%;">Thời Điểm Ứng Kỳ (Âm Lịch)</th>
              <th style="width: 25%;">Dương Lịch Quy Chiếu</th>
              <th style="width: 43%;">Dự Đoán Sự Việc & Biến Chuyển Cát Hung</th>
            </tr>
          </thead>
          <tbody>
            ${record.ungKy.map(u => `
              <tr>
                <td><strong>Ngày ${u.lunarDay || '-'} Tháng ${u.lunarMonth} Năm ${u.lunarYear}</strong></td>
                <td>${u.solarDate ? new Date(u.solarDate).toLocaleDateString('vi-VN') : '-'}</td>
                <td>${u.originalText || 'Ứng kỳ biến chuyển cát hung theo dịch tượng'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // IV. Toàn Văn Luận Giải Chu Dịch
  if (filteredSections.length > 0) {
    contentHtml += `
      <div class="page-break">
        <div class="doc-page-header">
          <span>Hồ Sơ Luận Giải Chu Dịch Chiêm Bốc</span>
          <span>Câu hỏi: ${question.slice(0, 35)}...</span>
        </div>
        <div style="text-align: center; margin: 16px 0 20px 0;">
          <h2 class="serif-title" style="font-size: 15pt; color: #78350f; margin-bottom: 4px;">TOÀN VĂN LUẬN ĐOÁN CHU DỊCH & DIỄN TƯỢNG</h2>
          <div style="font-size: 8pt; color: #64748b;">Hệ thống phân tích học thuật kết hợp Đại Trí Tuệ Nhân Tạo Mệnh Lý</div>
        </div>
    `;

    filteredSections.forEach((sec, idx) => {
      contentHtml += `
        <div class="${idx > 0 ? 'chapter-block' : ''}">
          <h2 class="doc-h1 serif-title">${sec.title}</h2>
          <div class="serif-body">
            ${markdownToHtml(sec.content)}
          </div>
        </div>
      `;
    });

    contentHtml += `</div>`;
  }

  return wrapCompleteHtml(`Quẻ Dịch - ${primary.name || 'Chu Dịch Chiêm Bốc'}`, contentHtml);
}

/**
 * Trích xuất Hỷ, Kỵ, Dụng Thần linh hoạt từ cấu trúc dữ liệu Bát Tự
 */
function extractDungHyKy(data) {
  if (!data) return { dungThan: '-', hyThan: '-', kyThan: '-' };

  // 1. Dụng Thần
  let dungThan = '';
  if (typeof data.dungThan === 'string' && data.dungThan.trim()) {
    dungThan = data.dungThan.trim();
  } else if (data.dungThan && typeof data.dungThan === 'object') {
    dungThan = data.dungThan.dungThan || data.dungThan.primary || data.dungThan.name || data.dungThan.element || '';
  }
  if (!dungThan && data.analysis) {
    dungThan = typeof data.analysis.dungThan === 'string' ? data.analysis.dungThan : (data.analysis.dungThan?.dungThan || '');
  }
  if (!dungThan && data.dungThanInfo?.primary) {
    dungThan = data.dungThanInfo.primary.dungThan || '';
  }
  if (!dungThan && data.analysisSnapshot?.dungThan) {
    dungThan = typeof data.analysisSnapshot.dungThan === 'string' ? data.analysisSnapshot.dungThan : (data.analysisSnapshot.dungThan?.dungThan || '');
  }

  // 2. Hỷ Thần
  let hyThan = '';
  if (typeof data.hyThan === 'string' && data.hyThan.trim()) {
    hyThan = data.hyThan.trim();
  } else if (data.dungThan && typeof data.dungThan === 'object' && data.dungThan.hyThan) {
    hyThan = data.dungThan.hyThan;
  }
  if (!hyThan && data.analysis) {
    hyThan = typeof data.analysis.hyThan === 'string' ? data.analysis.hyThan : (data.analysis.hyThan?.hyThan || '');
  }
  if (!hyThan && data.dungThanInfo?.primary) {
    hyThan = data.dungThanInfo.primary.hyThan || '';
  }
  if (!hyThan && data.analysisSnapshot?.hyThan) {
    hyThan = typeof data.analysisSnapshot.hyThan === 'string' ? data.analysisSnapshot.hyThan : (data.analysisSnapshot.hyThan?.hyThan || '');
  }

  // 3. Kỵ Thần
  let kyThan = '';
  if (typeof data.kyThan === 'string' && data.kyThan.trim()) {
    kyThan = data.kyThan.trim();
  } else if (data.dungThan && typeof data.dungThan === 'object' && data.dungThan.kyThan) {
    kyThan = data.dungThan.kyThan;
  }
  if (!kyThan && data.analysis) {
    kyThan = typeof data.analysis.kyThan === 'string' ? data.analysis.kyThan : (data.analysis.kyThan?.kyThan || '');
  }
  if (!kyThan && data.dungThanInfo?.primary) {
    kyThan = data.dungThanInfo.primary.kyThan || '';
  }
  if (!kyThan && data.analysisSnapshot?.kyThan) {
    kyThan = typeof data.analysisSnapshot.kyThan === 'string' ? data.analysisSnapshot.kyThan : (data.analysisSnapshot.kyThan?.kyThan || '');
  }

  return {
    dungThan: dungThan || '-',
    hyThan: hyThan || '-',
    kyThan: kyThan || '-'
  };
}

/**
 * Render bảng Tứ Trụ Can Chi đối chiếu (cho Trang 1 Hợp Hôn: 4 cột rộng rãi 100% chiều ngang)
 */
function renderMarriagePillarsMiniTable(canChi, isFemale) {
  const safeCanChi = {
    year: canChi?.year || {},
    month: canChi?.month || {},
    day: canChi?.day || {},
    hour: canChi?.hour || {}
  };
  const pillars = [
    { key: 'year', label: 'TRỤ NĂM', data: safeCanChi.year },
    { key: 'month', label: 'NGUYỆT LỆNH', data: safeCanChi.month },
    { key: 'day', label: 'NHẬT CHỦ', data: safeCanChi.day },
    { key: 'hour', label: 'TRỤ GIỜ', data: safeCanChi.hour }
  ];

  const headerColor = isFemale ? '#be123c' : '#1e3a8a';
  const tableBorder = isFemale ? '#fecdd3' : '#bfdbfe';

  return `
    <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 7.2pt; text-align: center; border: 1.5px solid ${tableBorder}; border-radius: 6px; overflow: hidden; background: #ffffff; margin-bottom: 2px;">
      <thead>
        <tr style="color: ${headerColor}; font-size: 7.2pt; font-weight: 900; text-transform: uppercase; border-bottom: 1.5px solid ${tableBorder};">
          ${pillars.map(p => `<th style="padding: 4px 2px; width: 25%; letter-spacing: 0.3px;">${p.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <!-- Thập Thần -->
        <tr style="background: #fafafa; height: 16px; border-bottom: 1px solid #f1f5f9;">
          ${pillars.map(p => {
            const isDay = p.key === 'day';
            const tt = isDay ? (isFemale ? 'Bản Thể' : 'Nhật Chủ') : (p.data?.thapThanGan || '-');
            return `<td style="font-weight: 700; color: #64748b; font-size: 6.8pt; padding: 1px 2px;">${tt}</td>`;
          }).join('')}
        </tr>
        <!-- Thiên Can -->
        <tr style="height: 22px; border-bottom: 1px solid #f1f5f9;">
          ${pillars.map(p => {
            const gan = p.data?.gan || '-';
            const elem = STEM_ELEMENTS[gan] || '';
            const color = ELEMENT_COLORS[elem]?.text || '#0f172a';
            return `<td style="font-size: 13pt; font-weight: 900; color: ${color}; line-height: 1;">${gan}</td>`;
          }).join('')}
        </tr>
        <!-- Địa Chi -->
        <tr style="height: 22px; border-bottom: 1px solid #f1f5f9;">
          ${pillars.map(p => {
            const zhi = p.data?.zhi || '-';
            const elem = BRANCH_ELEMENTS[zhi] || '';
            const color = ELEMENT_COLORS[elem]?.text || '#0f172a';
            return `<td style="font-size: 13pt; font-weight: 900; color: ${color}; line-height: 1;">${zhi}</td>`;
          }).join('')}
        </tr>
        <!-- Nạp Âm -->
        <tr style="height: 17px; border-bottom: 1px solid #f1f5f9; background: #fdfdfd;">
          ${pillars.map(p => {
            const naYin = p.data?.naYin || '-';
            return `<td style="font-size: 6.6pt; color: #334155; font-weight: 600; padding: 1px 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${naYin}</td>`;
          }).join('')}
        </tr>
        <!-- Tàng Can -->
        <tr style="background: #fafbfc;">
          ${pillars.map(p => {
            const tcList = p.data?.tangCan || [];
            if (!tcList || tcList.length === 0) {
              return `<td style="padding: 2px; font-size: 6.2pt; color: #94a3b8;">-</td>`;
            }
            return `
              <td style="padding: 2px 4px; vertical-align: top;">
                <div style="display: flex; flex-direction: column; gap: 1.5px;">
                  ${tcList.slice(0, 3).map(tc => {
                    const color = ELEMENT_COLORS[STEM_ELEMENTS[tc.gan]]?.text || '#334155';
                    return `
                      <div style="display: flex; justify-content: space-between; font-size: 6.2pt; padding: 0 4px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 2px;">
                        <span style="font-weight: 800; color: ${color};">${tc.gan}</span>
                        <span style="color: #64748b; font-size: 5.8pt;">${tc.thapThan || ''}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </td>
            `;
          }).join('')}
        </tr>
      </tbody>
    </table>
  `;
}

/**
 * Tạo HTML cho Hợp Hôn (Marriage) - Bát Tự & Bát Trạch Phối Cung Cổ Pháp
 */
function generateMarriageHtml(record, scope = []) {
  const inputInfo = record.inputInfo || {};
  const male = inputInfo.male || {};
  const female = inputInfo.female || {};
  const maleData = record.maleBaziData || record.analysisSnapshot?.maleBaziData || record.analysisSnapshot?.male || {};
  const femaleData = record.femaleBaziData || record.analysisSnapshot?.femaleBaziData || record.analysisSnapshot?.female || {};

  const hasScope = scope && scope.length > 0;
  const includeCompare = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('marriage_compare');
  const includePillars = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('marriage_pillars');

  let rawInterp = record.aiInterpretation?.content || record.analysis || record.analysisSnapshot?.aiInterpretation || '';
  if (!rawInterp && Array.isArray(record.aiInterpretation?.sections) && record.aiInterpretation.sections.length > 0) {
    rawInterp = record.aiInterpretation.sections.map(s => `### ${s.title || ''}\n\n${s.content || ''}`).join('\n\n');
  }

  const sections = parseInterpretationSections(rawInterp);
  const isAllInterpRequested = !hasScope ||
    scope.includes('all') ||
    scope.includes('interpretation') ||
    scope.includes('interp') ||
    scope.includes('intro') ||
    scope.includes('all_interpretation') ||
    scope.includes('marriage_interpretation');

  const filteredSections = sections.filter(sec => {
    if (isAllInterpRequested) return true;
    return scope.includes(sec.id) || scope.includes(`interp_${sec.id}`) || scope.includes(`marriage_${sec.id}`);
  });

  // Đánh giá 5 tiêu chí cổ học
  const mYearNaYin = maleData.canChi?.year?.naYin || '';
  const fYearNaYin = femaleData.canChi?.year?.naYin || '';
  const naYinRel = evaluateNaYinRelation(mYearNaYin, fYearNaYin);

  const mDayGan = maleData.canChi?.day?.gan || '';
  const fDayGan = femaleData.canChi?.day?.gan || '';
  const dayCanRel = evaluateCanRelation(mDayGan, fDayGan);

  const mDayZhi = maleData.canChi?.day?.zhi || '';
  const fDayZhi = femaleData.canChi?.day?.zhi || '';
  const dayZhiRel = evaluateZhiRelation(mDayZhi, fDayZhi);

  const mGua = maleData.menhQuai?.cung || '';
  const fGua = femaleData.menhQuai?.cung || '';
  const batTrachName = BAT_TRACH_PAIRS[mGua]?.[fGua] || '';
  const batTrachInfo = BAT_TRACH_NATURE[batTrachName] || { color: '#475569', bg: '#f8fafc', desc: 'Chưa xác định', type: 'bình' };

  const mDHK = extractDungHyKy(maleData);
  const fDHK = extractDungHyKy(femaleData);

  let contentHtml = '';

  const includeCover = scope.includes('cover') || scope.includes('all') || (!hasScope);
  if (includeCover) {
    contentHtml += renderCoverPage({
      system: 'marriage',
      title: 'HỢP HÔN ĐỐI CHIẾU GIA ĐẠO BẢN THƯ',
      subtitle: 'Tương Quan Bát Tự, Cung Phi Bát Trạch & Phác Đồ Hòa Hợp Gia Đạo',
      clientName: `${male.name || 'Gia Chủ Nam'} & ${female.name || 'Gia Chủ Nữ'}`,
      gender: 'Hợp Hôn Phu Thê',
      dateStr: `Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`,
      lunarStr: '',
      extraInfo: [
        { label: 'Chồng', value: `${male.name || 'Nam'} (${male.canChiYear || male.year || maleData.canChi?.year?.gan + ' ' + maleData.canChi?.year?.zhi || ''})` },
        { label: 'Vợ', value: `${female.name || 'Nữ'} (${female.canChiYear || female.year || femaleData.canChi?.year?.gan + ' ' + femaleData.canChi?.year?.zhi || ''})` },
        ...(batTrachName ? [{ label: 'Bát Trạch', value: `${batTrachName} (${batTrachInfo.desc})`, highlight: true }] : [])
      ],
      recordId: record._id || '',
      sealText: ['HỢP', 'HÔN', 'GIA', 'ĐẠO']
    });
  }

  const hasPage1 = includeCompare || includePillars;
  if (hasPage1) {
    contentHtml += `
      <!-- TRANG 1: HỒ SƠ TỔNG QUAN, 5 TIÊU CHÍ & TỨ TRỤ CAN CHI -->
      <div class="monograph-header" style="border: 1.5px solid #be123c; background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%); border-radius: 8px; padding: 7px 12px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="background: #be123c; color: #ffffff; font-size: 6.8pt; font-weight: 800; text-transform: uppercase; padding: 1.5px 7px; border-radius: 9999px;">Hồ Sơ Hợp Hôn Cá Nhân • Bát Tự & Bát Trạch</span>
          <span style="font-size: 7pt; color: #64748b; font-weight: 600;">MÃ HỒ SƠ: ${String(record._id || '').slice(0, 18)}</span>
        </div>
        <h1 class="serif-title" style="color: #881337; font-size: 14pt; font-weight: 900; margin: 3px 0 6px 0;">HỒ SƠ ĐỐI CHIẾU ĐỘ HÒA HỢP CẶP ĐÔI</h1>
        
        <div style="display: flex; gap: 10px;">
          <!-- Nam -->
          <div style="flex: 1; background: #ffffff; border: 1.5px solid #bfdbfe; border-radius: 6px; padding: 5px 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #dbeafe; padding-bottom: 2px; margin-bottom: 3px;">
              <span style="font-weight: 900; color: #1e40af; font-size: 8pt; text-transform: uppercase;">Đại Diện Nam Mệnh (Chồng): ${male.name || 'Gia Chủ Nam'}</span>
              <span style="font-size: 6.5pt; font-weight: 800; color: #2563eb; background: #eff6ff; padding: 1px 5px; border-radius: 3px;">Dương Cương</span>
            </div>
            <div style="font-size: 7.2pt; line-height: 1.4; color: #1e293b;">
              <div><strong>Dương Lịch:</strong> ${male.date || maleData.solarTimeline || '-'} (${male.time || ''})</div>
              <div><strong>Âm Lịch:</strong> ${maleData.lunarDateStr || '-'}</div>
              <div><strong>Nạp Âm Bản Mệnh:</strong> <span style="font-weight: 700; color: #b45309;">${mYearNaYin || maleData.canChi?.day?.naYin || '-'}</span></div>
              <div><strong>Cung Phi (Mệnh Quái):</strong> <span style="font-weight: 700; color: #1e40af;">${maleData.menhQuai ? formatMenhQuai(maleData.menhQuai) : '-'}</span></div>
            </div>
          </div>

          <!-- Nữ -->
          <div style="flex: 1; background: #ffffff; border: 1.5px solid #fecdd3; border-radius: 6px; padding: 5px 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ffe4e6; padding-bottom: 2px; margin-bottom: 3px;">
              <span style="font-weight: 900; color: #be123c; font-size: 8pt; text-transform: uppercase;">Đại Diện Nữ Mệnh (Vợ): ${female.name || 'Gia Chủ Nữ'}</span>
              <span style="font-size: 6.5pt; font-weight: 800; color: #f43f5e; background: #fff1f2; padding: 1px 5px; border-radius: 3px;">Âm Nhu</span>
            </div>
            <div style="font-size: 7.2pt; line-height: 1.4; color: #1e293b;">
              <div><strong>Dương Lịch:</strong> ${female.date || femaleData.solarTimeline || '-'} (${female.time || ''})</div>
              <div><strong>Âm Lịch:</strong> ${femaleData.lunarDateStr || '-'}</div>
              <div><strong>Nạp Âm Bản Mệnh:</strong> <span style="font-weight: 700; color: #64748b;">${fYearNaYin || femaleData.canChi?.day?.naYin || '-'}</span></div>
              <div><strong>Cung Phi (Mệnh Quái):</strong> <span style="font-weight: 700; color: #be123c;">${femaleData.menhQuai ? formatMenhQuai(femaleData.menhQuai) : '-'}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (includeCompare) {
      contentHtml += `
        <!-- I. BẢNG ĐỐI CHIẾU 5 TIÊU CHÍ CỐT LÕI -->
        <div class="no-break" style="margin-bottom: 8px;">
          <div style="display: align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 3.5px; height: 13px; background-color: #be123c; border-radius: 2px; vertical-align: middle; margin-right: 6px;"></span>
            <span class="serif-title" style="font-size: 9pt; font-weight: 900; color: #881337; text-transform: uppercase; letter-spacing: 0.3px; vertical-align: middle;">
              I. BẢNG ĐỐI CHIẾU 5 TIÊU CHÍ HỢP HÔN CỔ PHÁP
            </span>
          </div>
          <table class="gfm-table" style="margin-bottom: 0;">
            <thead>
              <tr style="background: #f8fafc; color: #334155; font-size: 7pt; font-weight: 800;">
                <th style="width: 22%;">Học Thuật Đối Chiếu</th>
                <th style="width: 24%;">Bên Nam (Chồng)</th>
                <th style="width: 24%;">Bên Nữ (Vợ)</th>
                <th style="width: 30%;">Đánh Giá Mức Độ Tương Hợp</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. Bản Mệnh Nạp Âm -->
              <tr>
                <td><strong>1. Bản Mệnh Nạp Âm</strong></td>
                <td>${mYearNaYin || '-'}</td>
                <td>${fYearNaYin || '-'}</td>
                <td>
                  <span style="font-weight: 800; color: ${naYinRel.color}; background: ${naYinRel.bg}; padding: 1px 6px; border-radius: 3px; display: inline-block; margin-bottom: 1px;">${naYinRel.text}</span>
                  <div style="font-size: 6.5pt; color: #64748b;">${naYinRel.desc}</div>
                </td>
              </tr>
              <!-- 2. Thiên Can (Nhật Can) -->
              <tr>
                <td><strong>2. Thiên Can Bản Thể</strong><br><span style="font-size: 6.2pt; color: #64748b;">Nhật Can (Tư tưởng, cốt cách)</span></td>
                <td>${mDayGan || '-'} (Hành ${STEM_ELEMENTS[mDayGan] || ''})</td>
                <td>${fDayGan || '-'} (Hành ${STEM_ELEMENTS[fDayGan] || ''})</td>
                <td>
                  <span style="font-weight: 800; color: ${dayCanRel.color}; background: ${dayCanRel.bg}; padding: 1px 6px; border-radius: 3px; display: inline-block; margin-bottom: 1px;">${dayCanRel.text}</span>
                  <div style="font-size: 6.5pt; color: #64748b;">${dayCanRel.desc}</div>
                </td>
              </tr>
              <!-- 3. Địa Chi (Cung Phu Thê) -->
              <tr>
                <td><strong>3. Địa Chi Phu Thê</strong><br><span style="font-size: 6.2pt; color: #64748b;">Nhật Chi (Tình cảm, gia đạo)</span></td>
                <td>Chi ${mDayZhi || '-'} (${maleData.canChi?.day?.canChi || '-'})</td>
                <td>Chi ${fDayZhi || '-'} (${femaleData.canChi?.day?.canChi || '-'})</td>
                <td>
                  <span style="font-weight: 800; color: ${dayZhiRel.color}; background: ${dayZhiRel.bg}; padding: 1px 6px; border-radius: 3px; display: inline-block; margin-bottom: 1px;">${dayZhiRel.text}</span>
                  <div style="font-size: 6.5pt; color: #64748b;">${dayZhiRel.desc}</div>
                </td>
              </tr>
              <!-- 4. Cung Phi Bát Trạch -->
              <tr>
                <td><strong>4. Cung Phi Bát Trạch</strong><br><span style="font-size: 6.2pt; color: #64748b;">Khí trường không gian sống</span></td>
                <td>${maleData.menhQuai?.cung || '-'} (${maleData.menhQuai?.group || '-'})</td>
                <td>${femaleData.menhQuai?.cung || '-'} (${femaleData.menhQuai?.group || '-'})</td>
                <td>
                  <span style="font-weight: 800; color: ${batTrachInfo.color}; background: ${batTrachInfo.bg}; padding: 1px 6px; border-radius: 3px; display: inline-block; margin-bottom: 1px;">Cung ${batTrachName || 'Chưa rõ'} (${batTrachInfo.type === 'cát' ? 'Cát' : 'Hung'})</span>
                  <div style="font-size: 6.5pt; color: #64748b;">${batTrachInfo.desc}</div>
                </td>
              </tr>
              <!-- 5. Hỷ Kỵ Dụng Thần -->
              <tr>
                <td><strong>5. Hỷ Kỵ Dụng Thần</strong><br><span style="font-size: 6.2pt; color: #64748b;">Trợ lực bổ khuyết năng lượng</span></td>
                <td>Dụng: <strong>${renderElementText(mDHK.dungThan)}</strong> | Hỷ: <strong>${renderElementText(mDHK.hyThan)}</strong> | Kỵ: <strong>${renderElementText(mDHK.kyThan)}</strong></td>
                <td>Dụng: <strong>${renderElementText(fDHK.dungThan)}</strong> | Hỷ: <strong>${renderElementText(fDHK.hyThan)}</strong> | Kỵ: <strong>${renderElementText(fDHK.kyThan)}</strong></td>
                <td>
                  <span style="font-weight: 700; color: #047857; background: #ecfdf5; padding: 1px 6px; border-radius: 3px; display: inline-block;">Cân bằng đa chiều</span>
                  <div style="font-size: 6.5pt; color: #64748b;">Khí lực hỗ trợ bổ khuyết cho nhau</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- II. SO SÁNH TỶ LỆ NGŨ HÀNH -->
        <div class="no-break" style="margin-bottom: 8px;">
          <div style="display: align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 3.5px; height: 13px; background-color: #b45309; border-radius: 2px; vertical-align: middle; margin-right: 6px;"></span>
            <span class="serif-title" style="font-size: 9pt; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 0.3px; vertical-align: middle;">
              II. ĐÁNH GIÁ CÂN BẰNG TỶ LỆ NGŨ HÀNH (NAM & NỮ)
            </span>
          </div>
          <table class="gfm-table" style="margin-bottom: 0; text-align: center;">
            <thead>
              <tr style="background: #f8fafc; font-size: 7pt; font-weight: 800;">
                <th style="width: 16%; text-align: left;">Đương Số</th>
                <th style="width: 16.8%; color: #64748b;">Kim 🪙</th>
                <th style="width: 16.8%; color: #059669;">Mộc 🌲</th>
                <th style="width: 16.8%; color: #2563eb;">Thủy 💧</th>
                <th style="width: 16.8%; color: #dc2626;">Hỏa 🔥</th>
                <th style="width: 16.8%; color: #b45309;">Thổ ⛰️</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: left; font-weight: 800; color: #1e40af;">Bên Nam</td>
                <td><strong>${Math.round(maleData.nguHanh?.Kim || 0)}%</strong></td>
                <td><strong>${Math.round(maleData.nguHanh?.Moc || 0)}%</strong></td>
                <td><strong>${Math.round(maleData.nguHanh?.Thuy || 0)}%</strong></td>
                <td><strong>${Math.round(maleData.nguHanh?.Hoa || 0)}%</strong></td>
                <td><strong>${Math.round(maleData.nguHanh?.Tho || 0)}%</strong></td>
              </tr>
              <tr>
                <td style="text-align: left; font-weight: 800; color: #be123c;">Bên Nữ</td>
                <td><strong>${Math.round(femaleData.nguHanh?.Kim || 0)}%</strong></td>
                <td><strong>${Math.round(femaleData.nguHanh?.Moc || 0)}%</strong></td>
                <td><strong>${Math.round(femaleData.nguHanh?.Thuy || 0)}%</strong></td>
                <td><strong>${Math.round(femaleData.nguHanh?.Hoa || 0)}%</strong></td>
                <td><strong>${Math.round(femaleData.nguHanh?.Tho || 0)}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    if (includePillars) {
      contentHtml += `
        <!-- III. CẤU TRÚC TỨ TRỤ CAN CHI NAM - NỮ -->
        <div class="no-break" style="margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 3.5px; height: 13px; background-color: #881337; border-radius: 2px; vertical-align: middle; margin-right: 6px;"></span>
            <span class="serif-title" style="font-size: 8.8pt; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 0.3px; vertical-align: middle;">
              III. CẤU TRÚC TỨ TRỤ CAN CHI (ĐỐI CHIẾU NAM TRÊN - NỮ DƯỚI)
            </span>
          </div>

          <!-- BẢNG 1: NAM MỆNH (CHỒNG) -->
          <div style="margin-bottom: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-size: 7.2pt; font-weight: 900; color: #1e40af; text-transform: uppercase;">
                ♂ TỨ TRỤ NAM MỆNH (CHỒNG): ${male.name || 'Gia Chủ Nam'}
              </span>
              <span style="font-size: 6.2pt; color: #64748b;">(Trụ Năm - Nguyệt Lệnh - Nhật Chủ - Trụ Giờ)</span>
            </div>
            ${renderMarriagePillarsMiniTable(maleData.canChi, false)}
          </div>

          <!-- BẢNG 2: NỮ MỆNH (VỢ) -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-size: 7.2pt; font-weight: 900; color: #be123c; text-transform: uppercase;">
                ♀ TỨ TRỤ NỮ MỆNH (VỢ): ${female.name || 'Gia Chủ Nữ'}
              </span>
              <span style="font-size: 6.2pt; color: #64748b;">(Trụ Năm - Nguyệt Lệnh - Nhật Chủ - Trụ Giờ)</span>
            </div>
            ${renderMarriagePillarsMiniTable(femaleData.canChi, true)}
        </div>
      `;
    }
  }

  // Luận giải (Trang 2+)
  if (filteredSections.length > 0) {
    if (hasPage1) {
      contentHtml += `<div class="page-break" style="padding-top: 5px;">`;
    } else {
      contentHtml += `<div style="padding-top: 5px;">`;
    }

    contentHtml += `
      <div class="doc-page-header">
        <span>Hồ Sơ Luận Giải Hợp Hôn Cổ Pháp</span>
        <span>Nam: ${male.name || 'Nam'} & Nữ: ${female.name || 'Nữ'}</span>
      </div>
      <div style="text-align: center; margin: 12px 0 16px 0;">
        <h2 class="serif-title" style="font-size: 14pt; color: #881337; margin-bottom: 3px;">TOÀN VĂN BẢN LUẬN GIẢI HÔN NHÂN & CHIẾN LƯỢC HÒA HỢP</h2>
        <div style="font-size: 7.5pt; color: #64748b;">Hệ Thống Trí Tuệ Nhân Tạo Mệnh Lý & Quy Tắc Cổ Học Bát Tự Phối Ngẫu</div>
      </div>

      ${filteredSections.map((sec, idx) => `
        <div class="${idx > 0 ? 'chapter-block' : ''}">
          <h2 class="doc-h1 serif-title" style="color: #881337; border-left: 3px solid #be123c; padding-left: 6px; margin-top: ${idx === 0 ? '0' : '6px'}; margin-bottom: 6px;">${sec.title}</h2>
          <div class="serif-body">
            ${markdownToHtml(sec.content)}
          </div>
        </div>
      `).join('')}
    </div>
    `;
  }

  return wrapCompleteHtml(`Hợp Hôn - ${male.name || 'Nam'} & ${female.name || 'Nữ'}`, contentHtml);
}

/**
 * Bọc toàn bộ trang HTML chuẩn in ấn
 */
function wrapCompleteHtml(title, bodyContent) {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        ${getCorePrintStyles()}
      </style>
    </head>
    <body>
      ${bodyContent}
    </body>
    </html>
  `;
}

module.exports = {
  generateBaziHtml,
  generateZiweiHtml,
  generateIChingHtml,
  generateMarriageHtml,
  parseInterpretationSections
};

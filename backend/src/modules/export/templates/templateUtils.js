/**
 * templateUtils.js - Tiện Ích & Định Dạng Bố Cục Cho PDF Template
 */

const { getCorePrintStyles } = require('./templateStyles');

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
  ELEMENT_COLORS,
  STEM_ELEMENTS,
  BRANCH_ELEMENTS,
  THAP_THAN_ABBREV,
  TRUONG_SINH_MAP,
  BAT_TRACH_PAIRS,
  BAT_TRACH_NATURE,
  CAN_HOP,
  CHI_LUC_HOP,
  CHI_TAM_HOP,
  CHI_LUC_XUNG,
  CHI_LUC_HAI,
  REMEDY_DATA,
  SYSTEM_COVER_CONFIGS,
  getElemTextColor,
  renderElementText,
  abbreviateThapThan,
  getTruongSinh,
  formatMenhQuai,
  evaluateNaYinRelation,
  evaluateCanRelation,
  evaluateZhiRelation,
  getRemedy,
  classifyShenSha,
  isCatThan,
  parseInterpretationSections,
  markdownToHtml,
  renderCoverPage,
  wrapCompleteHtml
};

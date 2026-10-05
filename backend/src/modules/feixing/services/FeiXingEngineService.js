/**
 * FeiXingEngineService.js
 * Rule Engine tính toán học thuật Huyền Không Phi Tinh (Xuan Kong Fei Xing)
 * 100% Thuật toán tĩnh xác định: 24 Sơn Hướng, Tam Nguyên Long, Âm Dương phi tinh,
 * Lập Vận Bàn, Sơn Bàn, Hướng Bàn, Chính Hướng vs Kiêm Hướng (Thế Quái),
 * Nhận diện Không Vong, 4 Đại Cách Cục, Cách Cục Đặc Biệt và Ma Trận 81 Cặp Sao.
 */

// 1. Định nghĩa 8 Cung Lạc Thư và Nguyên Đán Bàn
const PALACES = {
  KHAM: { id: 1, key: 'KHAM', name: 'Khảm', direction: 'Bắc', element: 'Thủy', baseStar: 1, opposite: 'LY' },
  KHON: { id: 2, key: 'KHON', name: 'Khôn', direction: 'Tây Nam', element: 'Thổ', baseStar: 2, opposite: 'CAN_NE' },
  CHAN: { id: 3, key: 'CHAN', name: 'Chấn', direction: 'Đông', element: 'Mộc', baseStar: 3, opposite: 'DOAI' },
  TON: { id: 4, key: 'TON', name: 'Tốn', direction: 'Đông Nam', element: 'Mộc', baseStar: 4, opposite: 'CAN' },
  TRUNG: { id: 5, key: 'TRUNG', name: 'Trung Cung', direction: 'Trung Tâm', element: 'Thổ', baseStar: 5, opposite: 'TRUNG' },
  CAN: { id: 6, key: 'CAN', name: 'Càn', direction: 'Tây Bắc', element: 'Kim', baseStar: 6, opposite: 'TON' },
  DOAI: { id: 7, key: 'DOAI', name: 'Đoài', direction: 'Tây', element: 'Kim', baseStar: 7, opposite: 'CHAN' },
  CAN_NE: { id: 8, key: 'CAN_NE', name: 'Cấn', direction: 'Đông Bắc', element: 'Thổ', baseStar: 8, opposite: 'KHON' },
  LY: { id: 9, key: 'LY', name: 'Ly', direction: 'Nam', element: 'Hỏa', baseStar: 9, opposite: 'KHAM' }
};

// Thứ tự bay Lạc Thư chuẩn qua 9 cung (bắt đầu từ Trung Cung)
const LO_SHU_FLIGHT_ORDER = [
  'TRUNG',  // Step 0: Trung Cung (5)
  'CAN',    // Step 1: Càn (6)
  'DOAI',   // Step 2: Đoài (7)
  'CAN_NE', // Step 3: Cấn (8)
  'LY',     // Step 4: Ly (9)
  'KHAM',   // Step 5: Khảm (1)
  'KHON',   // Step 6: Khôn (2)
  'CHAN',   // Step 7: Chấn (3)
  'TON'     // Step 8: Tốn (4)
];

// 2. Danh mục 24 Sơn Hướng (Nhị Thập Tứ Sơn)
// Mỗi sơn đúng 15 độ. Tâm 0°/360° là Tý.
const MOUNTAINS = [
  { name: 'Tý', palaceKey: 'KHAM', longType: 'THIEN', sign: -1, center: 0, min: 352.5, max: 7.5 },
  { name: 'Quý', palaceKey: 'KHAM', longType: 'NHAN', sign: -1, center: 15, min: 7.5, max: 22.5 },
  { name: 'Sửu', palaceKey: 'CAN_NE', longType: 'DIA', sign: -1, center: 30, min: 22.5, max: 37.5 },
  { name: 'Cấn', palaceKey: 'CAN_NE', longType: 'THIEN', sign: 1, center: 45, min: 37.5, max: 52.5 },
  { name: 'Dần', palaceKey: 'CAN_NE', longType: 'NHAN', sign: 1, center: 60, min: 52.5, max: 67.5 },
  { name: 'Giáp', palaceKey: 'CHAN', longType: 'DIA', sign: 1, center: 75, min: 67.5, max: 82.5 },
  { name: 'Mão', palaceKey: 'CHAN', longType: 'THIEN', sign: -1, center: 90, min: 82.5, max: 97.5 },
  { name: 'Ất', palaceKey: 'CHAN', longType: 'NHAN', sign: -1, center: 105, min: 97.5, max: 112.5 },
  { name: 'Thìn', palaceKey: 'TON', longType: 'DIA', sign: -1, center: 120, min: 112.5, max: 127.5 },
  { name: 'Tốn', palaceKey: 'TON', longType: 'THIEN', sign: 1, center: 135, min: 127.5, max: 142.5 },
  { name: 'Tị', palaceKey: 'TON', longType: 'NHAN', sign: 1, center: 150, min: 142.5, max: 157.5 },
  { name: 'Bính', palaceKey: 'LY', longType: 'DIA', sign: 1, center: 165, min: 157.5, max: 172.5 },
  { name: 'Ngọ', palaceKey: 'LY', longType: 'THIEN', sign: -1, center: 180, min: 172.5, max: 187.5 },
  { name: 'Đinh', palaceKey: 'LY', longType: 'NHAN', sign: -1, center: 195, min: 187.5, max: 202.5 },
  { name: 'Mùi', palaceKey: 'KHON', longType: 'DIA', sign: -1, center: 210, min: 202.5, max: 217.5 },
  { name: 'Khôn', palaceKey: 'KHON', longType: 'THIEN', sign: 1, center: 225, min: 217.5, max: 232.5 },
  { name: 'Thân', palaceKey: 'KHON', longType: 'NHAN', sign: 1, center: 240, min: 232.5, max: 247.5 },
  { name: 'Canh', palaceKey: 'DOAI', longType: 'DIA', sign: 1, center: 255, min: 247.5, max: 262.5 },
  { name: 'Dậu', palaceKey: 'DOAI', longType: 'THIEN', sign: -1, center: 270, min: 262.5, max: 277.5 },
  { name: 'Tân', palaceKey: 'DOAI', longType: 'NHAN', sign: -1, center: 285, min: 277.5, max: 292.5 },
  { name: 'Tuất', palaceKey: 'CAN', longType: 'DIA', sign: -1, center: 300, min: 292.5, max: 307.5 },
  { name: 'Càn', palaceKey: 'CAN', longType: 'THIEN', sign: 1, center: 315, min: 307.5, max: 322.5 },
  { name: 'Hợi', palaceKey: 'CAN', longType: 'NHAN', sign: 1, center: 330, min: 322.5, max: 337.5 },
  { name: 'Nhâm', palaceKey: 'KHAM', longType: 'DIA', sign: 1, center: 345, min: 337.5, max: 352.5 }
];

// Bản đồ Thế Quái Ca Quyết (Thay Quái) cho 24 Sơn
// "Tý Quý Giáp Thân Khôn Nhâm Nhất; Mão Ất Dần Thìn Tốn Lục xuy; Cấn Bính Canh Tuất Cửu Tử thị; Ngọ Đinh Dậu Tân Càn Hợi Nhị; Sửu Mùi Thất Xích tòng."
const SUBSTITUTION_STARS = {
  'Tý': 1, 'Quý': 1, 'Nhâm': 1, 'Giáp': 1, 'Thân': 1, 'Khôn': 1,
  'Mão': 6, 'Ất': 6, 'Dần': 6, 'Thìn': 6, 'Tốn': 6, 'Tị': 6,
  'Cấn': 9, 'Bính': 9, 'Canh': 9, 'Tuất': 9,
  'Ngọ': 2, 'Đinh': 2, 'Dậu': 2, 'Tân': 2, 'Càn': 2, 'Hợi': 2,
  'Sửu': 7, 'Mùi': 7
};

// 3. Ma trận luận đoán 81 Cặp Sao Phi Tinh (Sơn - Hướng)
const STAR_COMBINATIONS = {
  '1-1': { auspicious: 'CAT', meaning: 'Song Thủy đồng cung: Khảm Thủy tụ hội, chủ danh tiếng, đỗ đạt khoa bảng, cơ trí linh hoạt.', rooms: ['Phòng học', 'Phòng làm việc', 'Thư phòng'], cure: 'Bố trí bút lông Văn Xương, cây xanh phong thủy để Thủy sinh Mộc thông quan.' },
  '1-2': { auspicious: 'DAI_HUNG', meaning: 'Thổ khắc Thủy: Khôn Thổ khắc Khảm Thủy, chủ bệnh khí huyết, phụ nữ hiếm muộn, trạch vận trắc trở.', rooms: ['Khu vệ sinh', 'Nhà kho', 'Sân phơi phụ'], cure: 'Đặt hồ lô đồng, chuông gió đồng 6 ống (Kim) để tiết Thổ sinh Thủy hóa giải xung khắc.' },
  '1-3': { auspicious: 'CAT', meaning: 'Thủy sinh Mộc: Tự nhiên sinh trưởng, cơ trí thông minh, thích hợp sáng tạo nghệ thuật, kinh doanh buôn bán.', rooms: ['Phòng khách', 'Cửa hàng kinh doanh', 'Phòng làm việc'], cure: 'Bố trí tranh sơn thủy nhẹ nhàng hoặc phong thủy luân nước chảy êm đềm.' },
  '1-4': { auspicious: 'DAI_CAT', meaning: 'Nhất Tứ Đồng Cung: Đệ nhất Văn Xương tinh, văn danh vang dội, thi cử đỗ đạt, công danh rực rỡ.', rooms: ['Phòng học con cái', 'Bàn làm việc gia chủ', 'Thư phòng'], cure: 'Đặt Tháp Văn Xương 9 tầng bằng đồng hoặc bình thủy sinh 4 cành trúc phát tài.' },
  '1-6': { auspicious: 'DAI_CAT', meaning: 'Nhất Lục Cộng Tông: Kim Thủy tương sinh, quý hiển quyền uy, văn quan đắc vị, tài lộc dồi dào.', rooms: ['Cửa chính', 'Phòng khách', 'Phòng ngủ gia chủ Master'], cure: 'Bố trí vật phẩm kim loại tròn sáng hoặc quả cầu pha lê trắng đón thanh khí.' },
  '1-7': { auspicious: 'BINH', meaning: 'Kim Thủy đa tình: Thất Xích Kim sinh Nhất Bạch Thủy, chủ phong lưu đào hoa, đề phòng thị phi tình cảm.', rooms: ['Phòng ngủ phụ', 'Khu vực để đồ'], cure: 'Cân bằng ánh sáng, giữ không gian thanh tịnh, tránh đặt tranh ảnh đào hoa quá mức.' },
  '1-8': { auspicious: 'CAT', meaning: 'Thổ Thủy giao cảm: Thổ khắc Thủy nhưng Bát Bạch là cát tinh, con cháu hiếu thuận, điền sản vượng phát.', rooms: ['Phòng ngủ con cái', 'Phòng làm việc'], cure: 'Dùng đèn sáng màu vàng ấm kết hợp vật phẩm kim khí để thông quan Thổ - Kim - Thủy.' },
  '1-9': { auspicious: 'DAI_CAT', meaning: 'Thủy Hỏa Ký Tế: Âm Dương tương hợp, hỷ khánh liên miên, phát triển danh tiếng và tài chính vượt bậc.', rooms: ['Cửa chính', 'Phòng khách', 'Ban công đón khí'], cure: 'Bố trí chậu cây xanh phong thủy lá tròn (Mộc thông quan Thủy Hỏa) kích hoạt hỷ khí.' },
  '2-2': { auspicious: 'DAI_HUNG', meaning: 'Song Hắc tụ hội: Nhị Hắc Bệnh Phù trùng phùng, chủ bệnh tật mãn tính, tỳ vị dạ dày suy yếu, góa phụ quản gia.', rooms: ['Nhà kho kín', 'Khu vệ sinh'], cure: 'Tuyệt đối không động thổ tạo chấn động. Treo hồ lô đồng phong thủy và chuông gió đồng 6 ống.' },
  '2-3': { auspicious: 'DAI_HUNG', meaning: 'Đấu Ngưu Sát: Tam Bích Mộc khắc Nhị Hắc Thổ, tranh chấp kiện tụng dữ dội, mẹ chồng nàng dâu bất hòa.', rooms: ['Nhà kho', 'Phòng tắm phụ'], cure: 'Dùng thảm màu đỏ, đèn sáng màu ấm (Hỏa) để tiết bớt Mộc khí và sinh Thổ hòa hoãn.' },
  '2-5': { auspicious: 'DAI_HUNG', meaning: 'Nhị Ngũ Giao Gia: Đại hung sát vô cùng nguy hiểm, chủ tai ương bất ngờ, trọng bệnh, phá tài tuyệt tự.', rooms: ['Tránh làm phòng ngủ hoặc bếp, thích hợp làm kho hoặc WC'], cure: 'Bắt buộc treo chuông gió đồng 6 ống, đặt hũ muối An Nhẫn Thủy và hồ lô đồng hồ điệp.' },
  '3-3': { auspicious: 'HUNG', meaning: 'Song Bích đáo cung: Xích Khẩu tranh đấu, thị phi khẩu thiệt liên miên, trộm cắp, tổn hại thanh danh.', rooms: ['Hành lang', 'Sân vườn'], cure: 'Bố trí ánh sáng đèn đỏ ấm hoặc thảm đỏ trang nhã để Hỏa tiết bớt Mộc khí hung hăng.' },
  '3-7': { auspicious: 'DAI_HUNG', meaning: 'Tam Thất Đấu Ngưu / Xuyên Tâm Sát: Kim Mộc giao tranh, chủ thương tật kim khí, kiện tụng, trộm cắp.', rooms: ['Lối đi phụ', 'Nhà kho dụng cụ'], cure: 'Dùng bình nước phong thủy tĩnh lặng (An Nhẫn Thủy) để hành Thủy thông quan Kim sinh Thủy sinh Mộc.' },
  '3-8': { auspicious: 'BINH', meaning: 'Mộc Thổ giao tranh: Đề phòng tổn thương con cái nhỏ tuổi (thương thiếu niên), cơ bắp xương khớp.', rooms: ['Phòng khách', 'Phòng sinh hoạt'], cure: 'Thắp đèn sáng ấm, treo tranh phong cảnh mặt trời mọc để Hỏa thông quan.' },
  '4-1': { auspicious: 'DAI_CAT', meaning: 'Danh Dương Tứ Hải: Tứ Lục Mộc đắc Nhất Bạch Thủy sinh dưỡng, học hành đỗ đạt cao, thi cử bảng vàng.', rooms: ['Phòng học', 'Bàn làm việc', 'Thư phòng'], cure: 'Bố trí Tháp Văn Xương ngọc bích hoặc 4 cành trúc phát tài trong bình nước sạch.' },
  '4-9': { auspicious: 'DAI_CAT', meaning: 'Mộc Hỏa Thông Minh: Tứ Lục Mộc sinh Cửu Tử Hỏa, tài năng phát tiết rực rỡ, danh tiếng vang xa, gia đạo vẻ vang.', rooms: ['Phòng khách', 'Phòng làm việc', 'Studio sáng tạo'], cure: 'Bố trí cây cảnh xanh tươi tốt, đèn chiếu tranh ấm áp đón nhận ánh sáng thiên nhiên.' },
  '5-2': { auspicious: 'DAI_HUNG', meaning: 'Ngũ Nhị Đồng Cung: Đại sát tinh hội tụ, tổn hại nghiêm trọng nhân đinh, bệnh nan y, gia đạo lụn bại.', rooms: ['Nhà kho kín', 'Khu vệ sinh trấn sát'], cure: 'Treo chuông gió đồng 6 ống, hũ muối phong thủy An Nhẫn Thủy, tiền đồng hoa mai phong thủy.' },
  '5-5': { auspicious: 'DAI_HUNG', meaning: 'Song Hoàng Hội Tụ: Độc sát cực mạnh, tuyệt đối không tạo chấn động âm thanh hay động thổ tu tạo.', rooms: ['Kho đồ kín', 'Khu vệ sinh'], cure: 'Treo chuông gió đồng 6 ống, đặt hồ lô ngũ đế bằng đồng lớn, hóa giải tuyệt đối.' },
  '6-6': { auspicious: 'CAT', meaning: 'Song Càn tụ hội: Võ tướng uy nghi, quyền uy lãnh đạo, củng cố cương vị người đứng đầu.', rooms: ['Phòng gia chủ', 'Phòng làm việc lãnh đạo', 'Két sắt'], cure: 'Bố trí tượng rồng uy nghi hoặc thạch anh trắng để củng cố linh khí Càn Kim.' },
  '6-7': { auspicious: 'DAI_HUNG', meaning: 'Giao Kiếm Sát: Càn Kim cùng Đoài Kim tương tranh, đao kiếm tranh đấu, đổ máu, kiện tụng quan trường.', rooms: ['Nhà kho dụng cụ cơ khí', 'Phòng phụ'], cure: 'Đặt bình nước phong thủy an tĩnh (An Nhẫn Thủy) để hành Thủy tiết bớt khí Kim xung sát.' },
  '6-8': { auspicious: 'DAI_CAT', meaning: 'Phú Quý Kiêm Toàn: Bát Bạch Thổ sinh Lục Bạch Kim, văn võ song toàn, điền sản vượng phát, quan lộc thăng tiến.', rooms: ['Cửa chính', 'Phòng khách', 'Phòng ngủ gia chủ Master'], cure: 'Bố trí phòng khách khang trang, đặt tỳ hưu đồng hoặc quả cầu thạch anh vàng tụ tài.' },
  '7-7': { auspicious: 'HUNG', meaning: 'Song Thất Phá Quân: Tiêu hao tài sản, đào hoa dữ dội, cẩn trọng hỏa hoạn và trộm cắp viếng thăm.', rooms: ['Khu vực để đồ', 'Sân phơi'], cure: 'Dùng một chậu nước phong thủy tĩnh lặng nuôi bèo nhỏ để tiết bớt Kim khí Phá Quân.' },
  '7-9': { auspicious: 'DAI_HUNG', meaning: 'Hỏa Thiêu Thiên Môn: Cửu Tử Hỏa nung nấu Đoài Kim, chủ hỏa hoạn, bệnh phổi họng, phụ nữ trong nhà bất hòa.', rooms: ['Kho đồ', 'Sân phơi đồ'], cure: 'Bổ sung vật phẩm Thổ khí (đồ gốm sứ Bát Tràng, thạch anh vàng) để Hỏa sinh Thổ sinh Kim hóa giải.' },
  '8-6': { auspicious: 'DAI_CAT', meaning: 'Thổ Kim Tương Sinh: Phú hào điền sản, con cháu thông tuệ, chức tước vinh hiển, gia đạo hưng thịnh.', rooms: ['Cửa chính', 'Phòng khách', 'Két sắt gia đình'], cure: 'Đặt tượng Tỳ Hưu phong thủy mạ đồng hoặc quả cầu thạch anh vàng để chiêu tài.' },
  '8-8': { auspicious: 'CAT', meaning: 'Song Bát Đáo Cung: Tả Phụ đại tài tinh, phúc thọ song toàn, gia đạo an vui, tích lũy đất đai vững chãi.', rooms: ['Phòng khách', 'Phòng ngủ con cái'], cure: 'Đặt quả cầu thạch anh hồng hoặc vàng, duy trì không gian ngăn nắp sáng sủa.' },
  '8-9': { auspicious: 'DAI_CAT', meaning: 'Hỷ Khánh Liên Miên: Bát Bạch Thổ đắc Cửu Tử Hỏa tương sinh, phát tài nhanh chóng, thăng tiến thần tốc.', rooms: ['Cửa chính', 'Ban công đón khí', 'Phòng làm việc'], cure: 'Thắp đèn sáng ấm, bày hoa tươi đơm hoa, mở cửa sổ đón ánh sáng mặt trời.' },
  '9-9': { auspicious: 'DAI_CAT', meaning: 'Cửu Tử Đương Lệnh: Đệ nhất thịnh vượng Vận 9 (2024-2043), công danh phát quang đại lợi, vạn sự hanh thông.', rooms: ['Cửa chính', 'Phòng khách', 'Khu kinh doanh buôn bán'], cure: 'Kích hoạt bằng ánh sáng rực rỡ, thảm màu đỏ/cam trang nhã, mở cửa đón khí vượng tối đa.' },
  '9-7': { auspicious: 'DAI_HUNG', meaning: 'Hỏa Thiêu Kim Sát: Hỏa khắc Kim dữ dội, bệnh tật về mắt tim, tranh cãi khẩu thiệt phụ nữ.', rooms: ['Nhà kho', 'Sân phơi'], cure: 'Bổ sung vật phẩm gốm sứ hoàng thổ, thạch anh vàng để tiết Hỏa sinh Kim điều hòa sinh khí.' }
};

// 4. Bảng Tra Cung Phi Bát Trạch và Du Niên 8 Hướng
const GUA_MAP = {
  1: { cung: 'Khảm', element: 'Thủy', group: 'Đông tứ mệnh' },
  2: { cung: 'Khôn', element: 'Thổ', group: 'Tây tứ mệnh' },
  3: { cung: 'Chấn', element: 'Mộc', group: 'Đông tứ mệnh' },
  4: { cung: 'Tốn', element: 'Mộc', group: 'Đông tứ mệnh' },
  5: { 
    male: { cung: 'Khôn', element: 'Thổ', group: 'Tây tứ mệnh' },
    female: { cung: 'Cấn', element: 'Thổ', group: 'Tây tứ mệnh' }
  },
  6: { cung: 'Càn', element: 'Kim', group: 'Tây tứ mệnh' },
  7: { cung: 'Đoài', element: 'Kim', group: 'Tây tứ mệnh' },
  8: { cung: 'Cấn', element: 'Thổ', group: 'Tây tứ mệnh' },
  9: { cung: 'Ly', element: 'Hỏa', group: 'Đông tứ mệnh' }
};

const BAT_TRACH_STARS = {
  'Khảm': {
    KHAM: { name: 'Phục Vị', type: 'CAT', desc: 'Bình yên, hòa thuận, củng cố tinh thần' },
    LY: { name: 'Diên Niên', type: 'CAT', desc: 'Gia đạo êm ấm, tài vận bền vững' },
    CHAN: { name: 'Thiên Y', type: 'CAT', desc: 'Sức khỏe dồi dào, quý nhân phù trợ' },
    TON: { name: 'Sinh Khí', type: 'CAT', desc: 'Tài lộc đại vượng, công danh thăng tiến' },
    DOAI: { name: 'Họa Hại', type: 'HUNG', desc: 'Thị phi, khẩu thiệt, vướng mắc' },
    CAN: { name: 'Lục Sát', type: 'HUNG', desc: 'Bất hòa, tai tiếng, trắc trở tình cảm' },
    CAN_NE: { name: 'Ngũ Quỷ', type: 'HUNG', desc: 'Tai họa bất ngờ, hao tài tốn của' },
    KHON: { name: 'Tuyệt Mệnh', type: 'HUNG', desc: 'Tổn hao nhân đinh, bệnh trọng, đại kỵ' }
  },
  'Ly': {
    LY: { name: 'Phục Vị', type: 'CAT', desc: 'Bình an, gia đạo hòa mục' },
    KHAM: { name: 'Diên Niên', type: 'CAT', desc: 'Phúc đức dài lâu, vợ chồng hòa thuận' },
    TON: { name: 'Thiên Y', type: 'CAT', desc: 'Khỏe mạnh, kinh tế hanh thông' },
    CHAN: { name: 'Sinh Khí', type: 'CAT', desc: 'Đại phú đại quý, sự nghiệp viên mãn' },
    CAN_NE: { name: 'Họa Hại', type: 'HUNG', desc: 'Thất bại nhỏ, hao tài' },
    KHON: { name: 'Lục Sát', type: 'HUNG', desc: 'Trục trặc tình duyên, tổn hao' },
    DOAI: { name: 'Ngũ Quỷ', type: 'HUNG', desc: 'Bất an gia đạo, hao tài' },
    CAN: { name: 'Tuyệt Mệnh', type: 'HUNG', desc: 'Đại hung sát, tổn hại sức khỏe và tài sản' }
  },
  'Chấn': {
    CHAN: { name: 'Phục Vị', type: 'CAT', desc: 'Tự cường, củng cố gốc rễ' },
    TON: { name: 'Diên Niên', type: 'CAT', desc: 'Gia đình gắn kết, tài vận hanh thông' },
    KHAM: { name: 'Thiên Y', type: 'CAT', desc: 'Trường thọ, phúc lộc vững bền' },
    LY: { name: 'Sinh Khí', type: 'CAT', desc: 'Thăng quan tiến chức, phúc lộc dồi dào' },
    KHON: { name: 'Họa Hại', type: 'HUNG', desc: 'Mất mát, quan sự tranh chấp' },
    CAN_NE: { name: 'Lục Sát', type: 'HUNG', desc: 'Mất ngủ, hao tài, tranh cãi' },
    CAN: { name: 'Ngũ Quỷ', type: 'HUNG', desc: 'Phá tài, hung hiểm khôn lường' },
    DOAI: { name: 'Tuyệt Mệnh', type: 'HUNG', desc: 'Hung sát lớn, tránh đặt giường/bàn thờ' }
  },
  'Tốn': {
    TON: { name: 'Phục Vị', type: 'CAT', desc: 'Ổn định, con cái học hành tấn tới' },
    CHAN: { name: 'Diên Niên', type: 'CAT', desc: 'Vợ chồng đồng lòng, tích lũy tài sản' },
    LY: { name: 'Thiên Y', type: 'CAT', desc: 'Thân tâm an lạc, tài lộc dồi dào' },
    KHAM: { name: 'Sinh Khí', type: 'CAT', desc: 'Vượng khí tối cao, kinh doanh phát đạt' },
    CAN: { name: 'Họa Hại', type: 'HUNG', desc: 'Tổn thất vặt, tinh thần mệt mỏi' },
    DOAI: { name: 'Lục Sát', type: 'HUNG', desc: 'Thị phi, tai ương tình cảm' },
    KHON: { name: 'Ngũ Quỷ', type: 'HUNG', desc: 'Bệnh tật, hao tài tán của' },
    CAN_NE: { name: 'Tuyệt Mệnh', type: 'HUNG', desc: 'Hung sát nặng, cần giải pháp phong thủy' }
  },
  'Càn': {
    CAN: { name: 'Phục Vị', type: 'CAT', desc: 'Quyền uy, củng cố vị thế lãnh đạo' },
    KHON: { name: 'Diên Niên', type: 'CAT', desc: 'Âm Dương giao hòa, tài lộc bền vững' },
    CAN_NE: { name: 'Thiên Y', type: 'CAT', desc: 'Sức khỏe tráng kiện, tài chính vững vàng' },
    DOAI: { name: 'Sinh Khí', type: 'CAT', desc: 'Danh vọng vang dội, kinh doanh thịnh vượng' },
    TON: { name: 'Họa Hại', type: 'HUNG', desc: 'Khẩu thiệt thị phi, mưu sự khó thành' },
    KHAM: { name: 'Lục Sát', type: 'HUNG', desc: 'Bất hòa, tai nạn hoặc trắc trở tình cảm' },
    CHAN: { name: 'Ngũ Quỷ', type: 'HUNG', desc: 'Hao tài, sức khỏe suy giảm' },
    LY: { name: 'Tuyệt Mệnh', type: 'HUNG', desc: 'Hỏa khắc Kim, đại hung sát tổn thương chủ nhà' }
  },
  'Khôn': {
    KHON: { name: 'Phục Vị', type: 'CAT', desc: 'Bao dung, đất đai điền sản vượng phát' },
    CAN: { name: 'Diên Niên', type: 'CAT', desc: 'Gia đạo an vui, sự nghiệp hanh thông' },
    DOAI: { name: 'Thiên Y', type: 'CAT', desc: 'Sức khỏe tốt, trợ giúp việc gia đình' },
    CAN_NE: { name: 'Sinh Khí', type: 'CAT', desc: 'Đại vượng điền sản, con cháu thành đạt' },
    CHAN: { name: 'Họa Hại', type: 'HUNG', desc: 'Thị phi phiền nhiễu, tổn tài' },
    LY: { name: 'Lục Sát', type: 'HUNG', desc: 'Thất thoát, bất hòa gia đạo' },
    TON: { name: 'Ngũ Quỷ', type: 'HUNG', desc: 'Bệnh tật, kinh tế trắc trở' },
    KHAM: { name: 'Tuyệt Mệnh', type: 'HUNG', desc: 'Đại hung sát, tổn hại nghiêm trọng nhân đinh' }
  },
  'Cấn': {
    CAN_NE: { name: 'Phục Vị', type: 'CAT', desc: 'Kiên cố, tĩnh tâm, hậu vận bình an' },
    DOAI: { name: 'Diên Niên', type: 'CAT', desc: 'Tình cảm mặn nồng, tài lộc trường cửu' },
    CAN: { name: 'Thiên Y', type: 'CAT', desc: 'Hóa giải ốm đau, kinh tế thịnh vượng' },
    KHON: { name: 'Sinh Khí', type: 'CAT', desc: 'Sinh sôi nảy nở, tài lộc đại phát' },
    LY: { name: 'Họa Hại', type: 'HUNG', desc: 'Trở ngại công việc, hao hụt tiền của' },
    CHAN: { name: 'Lục Sát', type: 'HUNG', desc: 'Kiện tụng, khẩu thiệt thị phi' },
    KHAM: { name: 'Ngũ Quỷ', type: 'HUNG', desc: 'Bệnh tật, phá tài, gia đình xáo trộn' },
    TON: { name: 'Tuyệt Mệnh', type: 'HUNG', desc: 'Đại sát, tổn thương tuổi trẻ con cái' }
  },
  'Đoài': {
    DOAI: { name: 'Phục Vị', type: 'CAT', desc: 'Vui vẻ, tài ăn nói, quan hệ rộng mở' },
    CAN_NE: { name: 'Diên Niên', type: 'CAT', desc: 'Hôn nhân êm ấm, tài lộc sung túc' },
    KHON: { name: 'Thiên Y', type: 'CAT', desc: 'Sức khỏe hồi phục, quý nhân tương trợ' },
    CAN: { name: 'Sinh Khí', type: 'CAT', desc: 'Quan vận hanh thông, danh lợi song toàn' },
    KHAM: { name: 'Họa Hại', type: 'HUNG', desc: 'Thị phi, tai ương nhỏ, thất thoát' },
    TON: { name: 'Lục Sát', type: 'HUNG', desc: 'Bất an, tranh cãi nội bộ' },
    LY: { name: 'Ngũ Quỷ', type: 'HUNG', desc: 'Hỏa khắc Kim, hao tài tổn đức' },
    CHAN: { name: 'Tuyệt Mệnh', type: 'HUNG', desc: 'Kim Mộc giao tranh, đại hung sát' }
  }
};

class FeiXingEngineService {
  /**
   * Tính toán độ lệch góc giữa 2 góc số (0-360)
   */
  static getAngularDistance(angle1, angle2) {
    let diff = Math.abs(angle1 - angle2) % 360;
    return diff > 180 ? 360 - diff : diff;
  }

  /**
   * Xác định Sơn, Quẻ, Tam Nguyên Long và Độ Lệch từ số độ La Kinh (0 - 359.99)
   */
  static identifyMountain(degree) {
    const deg = ((degree % 360) + 360) % 360;
    
    // Tìm sơn khớp với dải góc
    for (const m of MOUNTAINS) {
      let isInside = false;
      if (m.min > m.max) {
        // Vắt qua 0 độ (như Tý: 352.5 -> 7.5)
        isInside = (deg >= m.min || deg < m.max);
      } else {
        isInside = (deg >= m.min && deg < m.max);
      }

      if (isInside) {
        const deviation = this.getAngularDistance(deg, m.center);
        const palace = PALACES[m.palaceKey];
        
        // Phân loại kiểu hướng: Chính hướng, Kiêm hướng, Không vong
        let chartType = 'CHINH_HUONG';
        let isSubstitution = false;
        let substitutionInfo = '';

        if (deviation > 6.0) {
          // Gần biên (cách ranh giới < 1.5 độ)
          // Kiểm tra xem ranh giới là giữa 2 sơn cùng quẻ hay 2 quẻ khác nhau
          const distToMin = this.getAngularDistance(deg, m.min);
          const distToMax = this.getAngularDistance(deg, m.max);
          const boundaryDeg = distToMin < distToMax ? m.min : m.max;
          
          // Kiểm tra xem boundaryDeg có phải là ranh giới 8 quẻ chính (chia hết cho 45 độ: 22.5, 67.5, 112.5, v.v.)
          const isPalaceBoundary = Math.abs((boundaryDeg % 45) - 22.5) < 0.1;
          chartType = isPalaceBoundary ? 'DAI_KHONG_VONG' : 'TIEU_KHONG_VONG';
          isSubstitution = true;
          substitutionInfo = chartType === 'DAI_KHONG_VONG' 
            ? 'Phạm Đại Không Vong (ranh giới 2 cung Bát Quái), khí trường hỗn loạn.'
            : 'Phạm Tiểu Không Vong (ranh giới 2 sơn), tạp khí nặng.';
        } else if (deviation >= 3.0) {
          chartType = 'KIEM_HUONG';
          isSubstitution = true;
          substitutionInfo = `Lệch tâm sơn ${deviation.toFixed(1)}° (từ 3° đến 6°), áp dụng Thế Quái Bàn (Thay Quái).`;
        } else {
          substitutionInfo = `Lệch tâm sơn ${deviation.toFixed(1)}° (< 3°), trạch vận nạp khí thuần chính (Chính Quái Bàn).`;
        }

        return {
          mountain: m,
          palace,
          deviationDegree: parseFloat(deviation.toFixed(2)),
          chartType,
          isSubstitution,
          substitutionInfo
        };
      }
    }

    // Mặc định fallback an toàn (Tý)
    return {
      mountain: MOUNTAINS[0],
      palace: PALACES.KHAM,
      deviationDegree: 0,
      chartType: 'CHINH_HUONG',
      isSubstitution: false,
      substitutionInfo: ''
    };
  }

  /**
   * Tính toán quỹ đạo phi tinh Lạc Thư
   * @param {number} centerStar Sao nhập trung cung (1-9)
   * @param {boolean} isForward true nếu bay thuận, false nếu bay nghịch
   * @returns {Object} Bản đồ { PALACE_KEY: starNumber }
   */
  static flyStars(centerStar, isForward = true) {
    const starMap = {};
    for (let step = 0; step < 9; step++) {
      const palaceKey = LO_SHU_FLIGHT_ORDER[step];
      let star;
      if (isForward) {
        star = ((centerStar - 1 + step) % 9) + 1;
      } else {
        star = ((centerStar - 1 - step) % 9 + 9) % 9 + 1;
      }
      starMap[palaceKey] = star;
    }
    return starMap;
  }

  /**
   * Tìm quẻ gốc của một sao (Lạc Thư Nguyên Đán)
   */
  static getBasePalaceKeyForStar(star) {
    const palace = Object.values(PALACES).find(p => p.baseStar === star);
    return palace ? palace.key : 'TRUNG';
  }

  /**
   * Xác định tính Âm Dương (+1 hay -1) của một sao khi nhập trung cung
   * @param {number} star Sao cần xét (1-9)
   * @param {string} originalMountainName Tên sơn ban đầu của nhà
   * @param {string} originalLongType Tam nguyên long của nhà ('DIA', 'THIEN', 'NHAN')
   * @param {boolean} isSubstitution Có đang dùng thế quái hay không
   */
  static determineStarFlightSign(star, originalMountainName, originalLongType, isSubstitution = false) {
    // Trường hợp sao 5 (Ngũ Hoàng): Không có quẻ gốc, mượn tính Âm Dương của bản sơn
    if (star === 5) {
      const origMountain = MOUNTAINS.find(m => m.name === originalMountainName);
      return origMountain ? origMountain.sign : 1;
    }

    // Tra quẻ gốc của sao
    const basePalaceKey = this.getBasePalaceKeyForStar(star);
    
    // Tìm sơn trong quẻ gốc đó có cùng Tam Nguyên Long
    const correspondingMountain = MOUNTAINS.find(
      m => m.palaceKey === basePalaceKey && m.longType === originalLongType
    );

    if (correspondingMountain) {
      return correspondingMountain.sign; // +1 là Thuận, -1 là Nghịch
    }

    return 1;
  }

  /**
   * Tính toán Thành Môn Quyết cho Cung Hướng
   */
  static evaluateCastleGate(facingPalaceKey, period) {
    // 2 Cung giáp bên của Cung Hướng
    const palaceOrder = ['KHAM', 'CAN_NE', 'CHAN', 'TON', 'LY', 'KHON', 'DOAI', 'CAN'];
    const idx = palaceOrder.indexOf(facingPalaceKey);
    if (idx === -1) return { left: null, right: null };

    const leftIdx = (idx - 1 + palaceOrder.length) % palaceOrder.length;
    const rightIdx = (idx + 1) % palaceOrder.length;

    const leftPalaceKey = palaceOrder[leftIdx];
    const rightPalaceKey = palaceOrder[rightIdx];

    return {
      left: {
        palace: PALACES[leftPalaceKey].name,
        direction: PALACES[leftPalaceKey].direction,
        usable: true,
        description: `Thành môn bên trái tại cung ${PALACES[leftPalaceKey].name} (${PALACES[leftPalaceKey].direction}), hợp nạp tài khí.`
      },
      right: {
        palace: PALACES[rightPalaceKey].name,
        direction: PALACES[rightPalaceKey].direction,
        usable: true,
        description: `Thành môn bên phải tại cung ${PALACES[rightPalaceKey].name} (${PALACES[rightPalaceKey].direction}).`
      }
    };
  }

  /**
   * Tính Mệnh Quái (Cung Phi Bát Trạch) dựa trên Năm Sinh Dương Lịch và Giới Tính
   * @param {number} solarYear Năm sinh dương lịch (ví dụ 1990)
   * @param {number} gender 1: Nam, 0: Nữ
   */
  static calculateMenhQuai(solarYear, gender = 1) {
    let tempYear = parseInt(solarYear, 10);
    if (isNaN(tempYear)) return null;

    let sum = tempYear;
    while (sum >= 10) {
      sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    }

    let guaNum;
    const genderVal = parseInt(gender, 10) === 0 ? 0 : 1;
    if (genderVal === 1) {
      // Nam: 11 - sum
      guaNum = 11 - sum;
      if (guaNum <= 0) guaNum += 9;
      while (guaNum > 9) guaNum -= 9;
    } else {
      // Nữ: 4 + sum
      guaNum = 4 + sum;
      while (guaNum > 9) guaNum -= 9;
    }

    const gua = GUA_MAP[guaNum];
    if (guaNum === 5) {
      return genderVal === 1 ? gua.male : gua.female;
    }
    return gua;
  }

  /**
   * Xác định nhóm Trạch của Nhà theo Cung Tọa
   */
  static getHouseTrachGroup(sittingPalaceKey) {
    // Đông Tứ Trạch: Khảm (Bắc), Ly (Nam), Chấn (Đông), Tốn (Đông Nam)
    const dongTu = ['KHAM', 'LY', 'CHAN', 'TON'];
    return dongTu.includes(sittingPalaceKey) ? 'Đông tứ trạch' : 'Tây tứ trạch';
  }

  /**
   * Phân tích chuyên sâu từng cung trong Cửu Cung:
   * - Xác định 4 cấp độ Cát/Hung: DAI_CAT (Xanh lá), CAT (Xanh dương), BINH (Viền đen), DAI_HUNG (Đỏ)
   * - Phân bổ công năng phòng ốc riêng biệt cho từng cung
   * - Đưa ra pháp bảo hóa giải / kích hoạt chi tiết
   */
  static resolvePalaceAnalysis({ mStar, wStar, period, palace, pKey, batTrachStar }) {
    const pairKey = `${mStar}-${wStar}`;
    const mapped = STAR_COMBINATIONS[pairKey];

    // 1. Phân loại Cát / Hung theo 4 Cấp Độ Cổ Điển
    let auspicious = mapped?.auspicious;
    if (!auspicious) {
      if ((mStar === 5 || wStar === 5 || mStar === 2 || wStar === 2) && period !== 5 && period !== 2) {
        auspicious = 'DAI_HUNG';
      } else if (wStar === period || mStar === period || (mStar === 9 && wStar === 9) || (mStar === 1 && wStar === 6)) {
        auspicious = 'DAI_CAT';
      } else if (wStar === 1 || mStar === 1 || wStar === 8 || mStar === 8 || (batTrachStar && ['Sinh Khí', 'Thiên Y', 'Diên Niên'].includes(batTrachStar))) {
        auspicious = 'CAT';
      } else {
        auspicious = 'BINH';
      }
    }

    // 2. Ý nghĩa tổ hợp sao
    let meaning = mapped?.meaning;
    if (!meaning) {
      const starNames = {
        1: 'Nhất Bạch Thủy (Tham Lang - Danh Khí)',
        2: 'Nhị Hắc Thổ (Cự Môn - Bệnh Phù Sát)',
        3: 'Tam Bích Mộc (Lộc Tồn - Khẩu Thiệt)',
        4: 'Tứ Lục Mộc (Văn Khúc - Văn Xương Tinh)',
        5: 'Ngũ Hoàng Thổ (Liêm Trinh - Đại Sát)',
        6: 'Lục Bạch Kim (Vũ Khúc - Quyền Uy)',
        7: 'Thất Xích Kim (Phá Quân - Kiếm Sát)',
        8: 'Bát Bạch Thổ (Tả Phụ - Tài Tinh)',
        9: 'Cửu Tử Hỏa (Hữu Bật - Đương Vượng)'
      };
      meaning = `Tọa Sơn tinh ${mStar} (${starNames[mStar] || mStar}) phối hợp với Hướng tinh ${wStar} (${starNames[wStar] || wStar}) tại cung ${palace.name} (${palace.direction}). Khí trường ngũ hành ${palace.element} tiếp nhận năng lượng tương tác sinh khắc phong phú.`;
    }

    // 3. Không gian công năng phù hợp (Tùy biến riêng cho từng cung và đặc tính)
    let rooms = mapped?.rooms;
    if (!rooms || rooms.length === 0) {
      if (pKey === 'TRUNG') {
        rooms = ['Sảnh trung tâm', 'Giếng trời thông thoáng', 'Lối giao thông chính', 'Khu vực đệm sinh hoạt'];
      } else if (auspicious === 'DAI_CAT') {
        if (['LY', 'KHAM', 'DOAI'].includes(pKey)) {
          rooms = ['Cửa chính đón khí', 'Phòng khách khang trang', 'Ban công lớn', 'Sảnh đón'];
        } else if (['CAN', 'KHON'].includes(pKey)) {
          rooms = ['Phòng ngủ Master gia chủ', 'Phòng làm việc lãnh đạo', 'Két sắt tích tài'];
        } else {
          rooms = ['Phòng học Văn Xương', 'Phòng sinh hoạt chung', 'Khu kinh doanh buôn bán'];
        }
      } else if (auspicious === 'CAT') {
        if (['CHAN', 'TON'].includes(pKey)) {
          rooms = ['Phòng học tập con cái', 'Thư viện gia đình', 'Khu đọc sách'];
        } else if (['CAN_NE', 'KHON'].includes(pKey)) {
          rooms = ['Phòng ngủ con cái', 'Phòng nghỉ ngơi', 'Khu vực thiền tịnh'];
        } else {
          rooms = ['Phòng làm việc phụ', 'Phòng ngủ khách', 'Khu sinh hoạt chung'];
        }
      } else if (auspicious === 'DAI_HUNG' || auspicious === 'HUNG') {
        rooms = ['Nhà kho chứa đồ kín', 'Khu vệ sinh / WC', 'Sân phơi phụ', 'Cầu thang thoát hiểm'];
      } else {
        rooms = ['Phòng ăn gia đình', 'Hành lang di chuyển', 'Khu vực đệm để đồ', 'Kho gia dụng'];
      }
    }

    // 4. Pháp bảo kích hoạt & hóa giải đặc thù
    let cure = mapped?.cure;
    if (!cure) {
      if (pKey === 'TRUNG') {
        cure = 'Trung Cung là thái cực điểm của ngôi nhà, cần giữ sạch sẽ tĩnh lặng, tuyệt đối tránh đặt nhà vệ sinh, cầu thang xoắn hay bếp nấu tại đây.';
      } else if (auspicious === 'DAI_HUNG') {
        cure = 'Cung vị tụ khí hung sát: Treo chuông gió đồng 6 ống, đặt hồ lô phong thủy bằng đồng hoặc hũ muối An Nhẫn Thủy để tiết bớt Thổ sát, tránh tạo tiếng ồn lớn.';
      } else if (auspicious === 'DAI_CAT') {
        cure = 'Cung vị nạp cát khí đương lệnh: Thắp đèn chiếu sáng ấm áp, mở cửa sổ đón gió tươi, đặt phong thủy luân tụ tài hoặc thảm trang trí màu đỏ tươi đón lộc.';
      } else if (auspicious === 'CAT') {
        cure = 'Bố trí cây xanh phong thủy lá tròn mọng nước, tháp Văn Xương hoặc quả cầu thạch anh tự nhiên để duy trì trường khí sinh vượng ổn định.';
      } else {
        cure = 'Duy trì không gian ngăn nắp, thông gió đối lưu tự nhiên, bổ sung ánh sáng dịu nhẹ để kích hoạt sinh khí và giải tỏa khí tù đọng.';
      }
    }

    return { auspicious, meaning, rooms, cure };
  }

  /**
   * Tính toán toàn bộ Tinh Bàn Huyền Không Phi Tinh
   * @param {Object} params { period: 1-9, facingDegree: 0-359.99, ownerName: string, buildingYear: number, birthDate: string, birthHour: number, gender: number }
   */
  static calculateChart(params) {
    const { 
      period = 9, 
      facingDegree, 
      ownerName = 'Gia Chủ', 
      buildingYear = null,
      birthDate = '',
      birthHour = null,
      gender = 1
    } = params;

    const facingDeg = ((parseFloat(facingDegree) % 360) + 360) % 360;
    const sittingDeg = (facingDeg + 180) % 360;

    // 1. Nhận diện Sơn Tọa và Sơn Hướng
    const facingInfo = this.identifyMountain(facingDeg);
    const sittingInfo = this.identifyMountain(sittingDeg);

    // Tính toán Mệnh Quái Cung Phi & Mệnh Trạch Tương Phối của gia chủ
    let ownerSolarYear = null;
    if (birthDate) {
      if (String(birthDate).includes('-')) {
        ownerSolarYear = parseInt(String(birthDate).split('-')[0], 10);
      } else if (String(birthDate).includes('/')) {
        const parts = String(birthDate).split('/');
        ownerSolarYear = parseInt(parts[parts.length - 1], 10);
      }
    }

    const menhQuai = ownerSolarYear ? this.calculateMenhQuai(ownerSolarYear, gender) : null;
    const houseTrachGroup = this.getHouseTrachGroup(sittingInfo.palace.key);
    
    let isMenhTrachMatch = true;
    let menhTrachSummary = 'Chưa nhập năm sinh gia chủ để thẩm định Bát Trạch.';
    if (menhQuai) {
      const isOwnerDong = menhQuai.group.includes('Đông');
      const isHouseDong = houseTrachGroup.includes('Đông');
      isMenhTrachMatch = isOwnerDong === isHouseDong;
      menhTrachSummary = isMenhTrachMatch
        ? `Gia chủ ${menhQuai.group} (Cung ${menhQuai.cung}, hành ${menhQuai.element}) ở nhà ${houseTrachGroup} (Tọa ${sittingInfo.palace.name}): Mệnh Trạch Tương Phối (Hợp Trạch - Đại Cát), nạp vượng khí thuận lợi.`
        : `Gia chủ ${menhQuai.group} (Cung ${menhQuai.cung}, hành ${menhQuai.element}) ở nhà ${houseTrachGroup} (Tọa ${sittingInfo.palace.name}): Mệnh Trạch Bất Phối (Nghịch Trạch). Cần ưu tiên bố trí phòng ngủ và bàn làm việc tại các phương vị Sinh Khí, Thiên Y để hóa giải.`;
    }

    const ownerProfile = {
      birthDate: birthDate || '',
      birthHour: birthHour !== null && birthHour !== undefined ? parseInt(birthHour, 10) : null,
      gender: parseInt(gender, 10) === 0 ? 0 : 1,
      genderLabel: parseInt(gender, 10) === 0 ? 'Nữ' : 'Nam',
      solarYear: ownerSolarYear,
      cungPhi: menhQuai ? menhQuai.cung : '',
      menhNguHanh: menhQuai ? menhQuai.element : '',
      menhTrachGroup: menhQuai ? menhQuai.group : '',
      houseTrachGroup,
      isMenhTrachMatch,
      menhTrachSummary
    };

    // 2. Lập Vận Bàn (Thiên Bàn) - Luôn bay thuận
    const periodStarMap = this.flyStars(period, true);

    // 3. Xác định Sao Tọa (Sơn tinh) và Sao Hướng (Hướng tinh) nhập Trung Cung
    let sittingStarInCenter = periodStarMap[sittingInfo.palace.key];
    let waterStarInCenter = periodStarMap[facingInfo.palace.key];

    let substitutionDetail = '';
    // Xử lý Thế Quái nếu phạm Kiêm Hướng >= 3 độ
    if (facingInfo.isSubstitution) {
      const origSitSub = SUBSTITUTION_STARS[sittingInfo.mountain.name];
      const origFaceSub = SUBSTITUTION_STARS[facingInfo.mountain.name];
      if (origSitSub) sittingStarInCenter = origSitSub;
      if (origFaceSub) waterStarInCenter = origFaceSub;
      substitutionDetail = `Áp dụng Thế Quái Ca: Sơn tinh nhập trung thế số ${sittingStarInCenter}, Hướng tinh thế số ${waterStarInCenter}.`;
    }

    // 4. Xác định chiều bay Thuận/Nghịch của Sơn Tinh và Hướng Tinh
    const mountainSign = this.determineStarFlightSign(
      sittingStarInCenter,
      sittingInfo.mountain.name,
      sittingInfo.mountain.longType,
      facingInfo.isSubstitution
    );
    const waterSign = this.determineStarFlightSign(
      waterStarInCenter,
      facingInfo.mountain.name,
      facingInfo.mountain.longType,
      facingInfo.isSubstitution
    );

    const mountainFlight = mountainSign === 1 ? 'FORWARD' : 'REVERSE';
    const waterFlight = waterSign === 1 ? 'FORWARD' : 'REVERSE';

    const mountainStarMap = this.flyStars(sittingStarInCenter, mountainSign === 1);
    const waterStarMap = this.flyStars(waterStarInCenter, waterSign === 1);

    // 5. Tổng hợp Ma Trận 9 Cung (Grid Cửu Cung)
    const grid = [];
    const palaceKeys = ['KHAM', 'KHON', 'CHAN', 'TON', 'TRUNG', 'CAN', 'DOAI', 'CAN_NE', 'LY'];

    for (const pKey of palaceKeys) {
      const palace = PALACES[pKey];
      const pStar = periodStarMap[pKey];
      const mStar = mountainStarMap[pKey];
      const wStar = waterStarMap[pKey];

      // Tra sao Bát Trạch của gia chủ tại cung này nếu có thông tin mệnh quái
      let batTrachStar = '';
      let batTrachType = '';
      let batTrachDesc = '';
      if (pKey === 'TRUNG') {
        batTrachStar = 'Trung Cung';
        batTrachType = 'TRUNG_TINH';
        batTrachDesc = 'Trái tim của ngôi nhà, nơi giao thoa khí trường Cửu Cung';
      } else if (menhQuai && BAT_TRACH_STARS[menhQuai.cung] && BAT_TRACH_STARS[menhQuai.cung][pKey]) {
        const bt = BAT_TRACH_STARS[menhQuai.cung][pKey];
        batTrachStar = bt.name;
        batTrachType = bt.type;
        batTrachDesc = bt.desc;
      }

      const pairAnalysis = FeiXingEngineService.resolvePalaceAnalysis({
        mStar,
        wStar,
        period,
        palace,
        pKey,
        batTrachStar
      });

      grid.push({
        palaceKey: pKey,
        palaceName: palace.name,
        directionName: palace.direction,
        baseStar: palace.baseStar,
        periodStar: pStar,
        mountainStar: mStar,
        waterStar: wStar,
        mountainFlight,
        waterFlight,
        elementRelation: `${palace.element} tiếp nhận khí`,
        auspiciousLevel: pairAnalysis.auspicious,
        starPairMeaning: pairAnalysis.meaning,
        recommendedRooms: pairAnalysis.rooms,
        curesAndActivators: pairAnalysis.cure,
        batTrachStar,
        batTrachType,
        batTrachDesc
      });
    }

    // 6. Nhận diện Tứ Đại Cách Cục
    const mountainAtSitting = mountainStarMap[sittingInfo.palace.key];
    const waterAtFacing = waterStarMap[facingInfo.palace.key];
    const mountainAtFacing = mountainStarMap[facingInfo.palace.key];
    const waterAtSitting = waterStarMap[sittingInfo.palace.key];

    let majorPattern = 'BINH_HOA';
    let majorPatternName = 'Trạch Vận Bình Hòa';
    let majorPatternDescription = 'Tinh bàn phân bố khí đều, cần kích hoạt đúng vị trí đắc sinh vượng khí.';

    if (mountainAtSitting === period && waterAtFacing === period) {
      majorPattern = 'VUONG_SON_VUONG_HUONG';
      majorPatternName = 'Vượng Sơn Vượng Hướng (Đáo Sơn Đáo Hướng)';
      majorPatternDescription = 'Đệ nhất đại cát cục: Đinh tài lưỡng đắc, gia đạo an khang, kinh doanh phát đạt thịnh vượng trọn vẹn.';
    } else if (mountainAtFacing === period && waterAtFacing === period) {
      majorPattern = 'SONG_TINH_DAO_HUONG';
      majorPatternName = 'Song Tinh Đáo Hướng';
      majorPatternDescription = 'Vượng tài tổn đinh: Phía trước nhà có cả sao Sơn lẫn sao Hướng đương vận; tài lộc vượng phát nhưng cần chú ý sức khỏe nhân đinh.';
    } else if (mountainAtSitting === period && waterAtSitting === period) {
      majorPattern = 'SONG_TINH_DAO_TOA';
      majorPatternName = 'Song Tinh Đáo Tọa';
      majorPatternDescription = 'Vượng đinh bại tài: Khí vượng tụ phía sau nhà; gia đạo êm ấm, con cháu đông đúc nhưng tiền tài khó tích lũy, kinh doanh chậm mở rộng.';
    } else if (mountainAtFacing === period && waterAtSitting === period) {
      majorPattern = 'THUONG_SON_HA_THUY';
      majorPatternName = 'Thượng Sơn Hạ Thủy';
      majorPatternDescription = 'Tổn đinh phá tài: Sao Sơn xuống nước, sao Hướng lên núi. Hung cách lớn nếu thế đất bên ngoài không có biện pháp đảo ngược bố cục phong thủy.';
    }

    // 7. Nhận diện Cách Cục Đặc Biệt
    const specialFormations = [];
    
    // Kiểm tra Hợp Thập (Tam Bát Hóa Mộc / Tổng = 10)
    let isAllSum10 = true;
    for (const cell of grid) {
      if (cell.mountainStar + cell.waterStar !== 10 && cell.periodStar + cell.mountainStar !== 10 && cell.periodStar + cell.waterStar !== 10) {
        isAllSum10 = false;
        break;
      }
    }
    if (isAllSum10) {
      specialFormations.push('Đắc Toàn Bàn Hợp Thập (Cát cách trợ lực thông suốt)');
    }

    if (facingInfo.isSubstitution) {
      specialFormations.push(`Thế Quái Bàn (Kiêm Hướng ${facingInfo.deviationDegree}°)`);
    }

    if (facingInfo.chartType === 'DAI_KHONG_VONG' || facingInfo.chartType === 'TIEU_KHONG_VONG') {
      specialFormations.push(`Cảnh báo: ${facingInfo.substitutionInfo}`);
    }

    // 8. Thành Môn Quyết
    const castleGate = this.evaluateCastleGate(facingInfo.palace.key, period);

    return {
      period,
      buildingYear,
      ownerName,
      ownerBirthInfo: ownerProfile,
      facingDegree: facingDeg,
      sittingDegree: sittingDeg,
      facingMountain: facingInfo.mountain.name,
      sittingMountain: sittingInfo.mountain.name,
      facingPalace: facingInfo.palace.name,
      sittingPalace: sittingInfo.palace.name,
      chartType: facingInfo.chartType,
      isSubstitution: facingInfo.isSubstitution,
      substitutionInfo: substitutionDetail || facingInfo.substitutionInfo,
      deviationDegree: facingInfo.deviationDegree,
      analysisSnapshot: {
        majorPattern,
        majorPatternName,
        majorPatternDescription,
        specialFormations,
        castleGate,
        ownerProfile,
        grid,
        sittingStarAtSitting: mountainAtSitting,
        waterStarAtFacing: waterAtFacing,
        summaryAdvice: `Nhà Tọa ${sittingInfo.mountain.name} Hướng ${facingInfo.mountain.name}, Vận ${period}. Cách cục: ${majorPatternName}.`
      }
    };
  }
}

module.exports = FeiXingEngineService;

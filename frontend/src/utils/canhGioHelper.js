/**
 * Helper utility for 12 Canh Gio in Eastern Metaphysics
 */

export const CANH_GIO_LIST = [
  { chi: 'Tý', range: '23:00 - 00:59', hourStart: 23, hourEnd: 0, desc: 'Nửa đêm (Canh 3)' },
  { chi: 'Sửu', range: '01:00 - 02:59', hourStart: 1, hourEnd: 2, desc: 'Gà gáy (Canh 4)' },
  { chi: 'Dần', range: '03:00 - 04:59', hourStart: 3, hourEnd: 4, desc: 'Rạng đông (Canh 5)' },
  { chi: 'Mão', range: '05:00 - 06:59', hourStart: 5, hourEnd: 6, desc: 'Mặt trời mọc (Bình minh)' },
  { chi: 'Thìn', range: '07:00 - 08:59', hourStart: 7, hourEnd: 8, desc: 'Ăn sáng (Khoảng 7-9h sáng)' },
  { chi: 'Tỵ', range: '09:00 - 10:59', hourStart: 9, hourEnd: 10, desc: 'Gần trưa (Khoảng 9-11h trưa)' },
  { chi: 'Ngọ', range: '11:00 - 12:59', hourStart: 11, hourEnd: 12, desc: 'Chính trưa (Khoảng 11-13h)' },
  { chi: 'Mùi', range: '13:00 - 14:59', hourStart: 13, hourEnd: 14, desc: 'Đầu giờ chiều (Khoảng 13-15h)' },
  { chi: 'Thân', range: '15:00 - 16:59', hourStart: 15, hourEnd: 16, desc: 'Xế chiều (Khoảng 15-17h)' },
  { chi: 'Dậu', range: '17:00 - 18:59', hourStart: 17, hourEnd: 18, desc: 'Hoàng hôn (Khoảng 17-19h)' },
  { chi: 'Tuất', range: '19:00 - 20:59', hourStart: 19, hourEnd: 20, desc: 'Chập tối (Canh 1, khoảng 19-21h)' },
  { chi: 'Hợi', range: '21:00 - 22:59', hourStart: 21, hourEnd: 22, desc: 'Đêm muộn (Canh 2, khoảng 21-23h)' }
];

export const getCanhGioInfo = (hourStr) => {
  if (hourStr === '' || hourStr === undefined || hourStr === null) return null;
  const h = parseInt(hourStr, 10);
  if (isNaN(h)) return null;

  if (h === 23 || h === 0) {
    return CANH_GIO_LIST[0];
  }
  const found = CANH_GIO_LIST.slice(1).find(c => h >= c.hourStart && h <= c.hourEnd);
  return found || null;
};

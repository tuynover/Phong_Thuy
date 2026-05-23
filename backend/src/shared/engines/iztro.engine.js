const { astro } = require('iztro');

class IztroEngine {
  /**
   * Lập lá số Tử Vi thô
   * @param {Object} params { date: 'YYYY-MM-DD', hour: 0..11, gender: 'Nam'|'Nữ', lang: 'vi-VN' }
   * @returns {Object} Astrolabe thô
   */
  generate(params) {
    const { date, hour, gender, lang = 'vi-VN' } = params;
    
    // iztro yêu cầu giới tính truyền vào chữ Hán '男' (Nam) hoặc '女' (Nữ)
    const iztroGender = (gender === 'Nam' || gender === 1) ? '男' : '女';
    
    // Lập lá số Dương lịch mặc định
    return astro.bySolar(date, hour, iztroGender, false, lang);
  }
}

module.exports = IztroEngine;

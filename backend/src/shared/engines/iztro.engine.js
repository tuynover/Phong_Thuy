const { astro } = require('iztro');

class IztroEngine {
  /**
   * Lập lá số Tử Vi thô
   * @param {Object} params { date: 'YYYY-MM-DD', hour: 0..11, gender: 'Nam'|'Nữ', lang: 'vi-VN' }
   * @returns {Object} Astrolabe thô
   */
  generate(params) {
    const { date, hour, gender, lang = 'vi-VN' } = params;
    
    // Normalize gender inputs: Nam/male/1 -> '男' (Nam), Nữ/female/0 -> '女' (Nữ)
    const g = String(gender).trim().toLowerCase();
    const isMale = (g === 'nam' || g === '1' || g === 'male' || g === 'm');
    const iztroGender = isMale ? '男' : '女';
    
    // Lập lá số Dương lịch mặc định
    return astro.bySolar(date, hour, iztroGender, false, lang);
  }
}

module.exports = IztroEngine;

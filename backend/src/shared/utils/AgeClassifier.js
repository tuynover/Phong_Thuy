/**
 * AgeClassifier.js
 * Tiện ích xác định năm sinh, tính tuổi Âm lịch (tuổi mụ) và phân loại nhóm tuổi
 * phục vụ tối ưu hóa prompt cá nhân hóa cho Bát Tự và Tử Vi Đẩu Số.
 */

class AgeClassifier {
  /**
   * Trích xuất năm sinh dương lịch từ đối tượng record đa dạng (Bát Tự, Tử Vi, Client Payload)
   * @param {Object} record 
   * @returns {number|null} Năm sinh (4 chữ số) hoặc null nếu không xác định được
   */
  static extractBirthYear(record) {
    if (!record) return null;

    // 1. Kiểm tra trực tiếp birthSolarYear
    if (record.inputInfo?.birthSolarYear && !isNaN(record.inputInfo.birthSolarYear)) {
      return parseInt(record.inputInfo.birthSolarYear, 10);
    }
    if (record.birthSolarYear && !isNaN(record.birthSolarYear)) {
      return parseInt(record.birthSolarYear, 10);
    }

    // 2. Kiểm tra các trường ngày tháng linh hoạt
    const dateStr = record.inputInfo?.date 
      || record.date 
      || record.solarTimeline 
      || record.solarDate
      || record.chart_data?.solarDate
      || record.chartData?.chart_data?.solarDate
      || record.chartData?.solarDate;
    if (typeof dateStr === 'string') {
      const match = dateStr.match(/\b(19\d{2}|20\d{2})\b/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    // 3. Kiểm tra chartData của Tử Vi (iztro standard output)
    const iztroDate = record.chartData?.chart_data?.solarDate;
    if (typeof iztroDate === 'string') {
      const match = iztroDate.match(/\b(19\d{2}|20\d{2})\b/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    // 4. Kiểm tra manualData trong inputInfo
    if (record.inputInfo?.manualData?.birthSolarYear) {
      return parseInt(record.inputInfo.manualData.birthSolarYear, 10);
    }

    return null;
  }

  /**
   * Tính tuổi Âm lịch (tuổi mụ) và phân nhóm đối tượng
   * Tuổi mụ = Năm hiện tại - Năm sinh + 1
   * @param {Object} record - Bản ghi lá số hoặc inputInfo
   * @param {number} [targetYear] - Năm đối chiếu (mặc định là năm hiện tại)
   * @returns {Object} Thông tin tuổi và nhóm tuổi
   */
  static getLunarAgeInfo(record, targetYear = new Date().getFullYear()) {
    const birthYear = this.extractBirthYear(record);

    // Nếu không xác định được năm sinh, mặc định là người trưởng thành (ADULT) 30 tuổi
    if (!birthYear || isNaN(birthYear) || birthYear > targetYear + 1) {
      return {
        birthYear: null,
        lunarAge: 30,
        ageGroup: 'ADULT',
        label: 'Trung niên & Trưởng thành (30 - 55 tuổi)',
        isEstimated: true
      };
    }

    const rawLunarAge = targetYear - birthYear + 1;
    const lunarAge = rawLunarAge < 1 ? 1 : rawLunarAge;

    let ageGroup = 'ADULT';
    let label = 'Trung niên & Trưởng thành (30 - 55 tuổi)';

    if (lunarAge < 18) {
      ageGroup = 'CHILD';
      label = 'Ấu thơ & Học đường (Dưới 18 tuổi)';
    } else if (lunarAge < 30) {
      ageGroup = 'YOUNG_ADULT';
      label = 'Thanh niên & Khởi nghiệp (18 - 29 tuổi)';
    } else if (lunarAge <= 55) {
      ageGroup = 'ADULT';
      label = 'Trung niên & Trưởng thành (30 - 55 tuổi)';
    } else {
      ageGroup = 'SENIOR';
      label = 'Hậu vận & Cao niên (Trên 55 tuổi)';
    }

    return {
      birthYear,
      lunarAge,
      ageGroup,
      label,
      isEstimated: false
    };
  }
}

module.exports = AgeClassifier;

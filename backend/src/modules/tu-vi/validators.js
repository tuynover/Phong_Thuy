class TuViValidator {
  /**
   * Validate dữ liệu đầu vào cho lập lá số Tử Vi
   * @param {Object} data 
   * @returns {Object} { isValid: boolean, error: string|null, sanitized: Object }
   */
  static validateBirthInfo(data) {
    const { date, hour, gender, timezone = 7, school = 'bac_phai', calendarType = 'solar' } = data;

    // 1. Validate Date (YYYY-MM-DD)
    if (!date || typeof date !== 'string') {
      return { isValid: false, error: 'Ngày sinh không hợp lệ. Vui lòng cung cấp định dạng chuỗi YYYY-MM-DD.' };
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return { isValid: false, error: 'Định dạng ngày sinh phải là YYYY-MM-DD.' };
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return { isValid: false, error: 'Ngày sinh không tồn tại trên thực tế.' };
    }

    // 2. Validate Hour (0..11)
    const hr = parseInt(hour);
    if (isNaN(hr) || hr < 0 || hr > 11) {
      return { isValid: false, error: 'Giờ sinh phải là chỉ số từ 0 đến 11 tương ứng 12 Can Chi giờ.' };
    }

    // 3. Validate Gender
    if (!gender || (gender !== 'Nam' && gender !== 'Nữ')) {
      return { isValid: false, error: "Giới tính phải là 'Nam' hoặc 'Nữ'." };
    }

    // 4. Validate Timezone
    const tz = parseInt(timezone);
    if (isNaN(tz) || tz < -12 || tz > 14) {
      return { isValid: false, error: 'Múi giờ phải nằm trong khoảng từ -12 đến +14.' };
    }

    // 5. Validate School
    if (school !== 'bac_phai' && school !== 'nam_phai') {
      // Cho phép mặc định hoặc chỉnh sửa
    }

    return {
      isValid: true,
      error: null,
      sanitized: {
        date,
        hour: hr,
        gender,
        timezone: tz,
        school,
        calendarType
      }
    };
  }
}

module.exports = TuViValidator;

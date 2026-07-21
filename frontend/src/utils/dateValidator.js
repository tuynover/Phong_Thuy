/**
 * Client-side Real-time Date and Time Validator for Bazi, Ziwei, and Marriage forms.
 */
export const isLeapYear = (year) => {
  const y = parseInt(year, 10);
  if (isNaN(y)) return false;
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
};

export const getMaxDaysInMonth = (month, year) => {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (isNaN(m)) return 31;
  if (m === 2) {
    return isLeapYear(y) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(m)) {
    return 30;
  }
  return 31;
};

export const validateInputDate = (dayStr, monthStr, yearStr, hourStr, minuteStr) => {
  if (!dayStr && !monthStr && !yearStr) {
    return { isValid: true, message: '' };
  }

  // 1. Non-digit / String check
  if (dayStr && isNaN(Number(dayStr))) {
    return { isValid: false, message: 'Ngày sinh phải là số nguyên, không chứa chữ hoặc ký tự đặc biệt.' };
  }
  if (monthStr && isNaN(Number(monthStr))) {
    return { isValid: false, message: 'Tháng sinh phải là số nguyên, không chứa chữ hoặc ký tự đặc biệt.' };
  }
  if (yearStr && isNaN(Number(yearStr))) {
    return { isValid: false, message: 'Năm sinh phải là số nguyên, không chứa chữ hoặc ký tự đặc biệt.' };
  }

  const d = parseInt(dayStr, 10);
  const m = parseInt(monthStr, 10);
  const y = parseInt(yearStr, 10);

  // Range checks
  if (!isNaN(d) && (d < 1 || d > 31)) {
    return { isValid: false, message: `Ngày sinh (${dayStr}) không hợp lệ. Vui lòng nhập từ 1 đến 31.` };
  }
  if (!isNaN(m) && (m < 1 || m > 12)) {
    return { isValid: false, message: `Tháng sinh (${monthStr}) không hợp lệ. Vui lòng chọn tháng từ 1 đến 12.` };
  }
  if (!isNaN(y) && (y < 1900 || y > 2100)) {
    return { isValid: false, message: `Năm sinh (${yearStr}) phải nằm trong khoảng từ 1900 đến 2100.` };
  }

  // Smart Month/Year context check
  if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
    const maxDays = getMaxDaysInMonth(m, y);
    if (m === 2 && d === 29 && !isLeapYear(y)) {
      return {
        isValid: false,
        message: `Tháng 2 năm ${y} không phải là năm nhuận nên không có ngày 29. Vui lòng chọn ngày từ 1 đến 28.`
      };
    }
    if (d > maxDays) {
      return {
        isValid: false,
        message: `Tháng ${m} năm ${y} chỉ có tối đa ${maxDays} ngày, không có ngày ${d}.`
      };
    }

    // Check future date
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getTime() > Date.now()) {
      return { isValid: false, message: 'Ngày sinh không thể nằm ở tương lai.' };
    }
  }

  // Hour & Minute check if provided
  if (hourStr !== undefined && hourStr !== '') {
    if (isNaN(Number(hourStr))) {
      return { isValid: false, message: 'Giờ sinh phải là số nguyên.' };
    }
    const h = parseInt(hourStr, 10);
    if (h < 0 || h > 23) {
      return { isValid: false, message: 'Giờ sinh không hợp lệ (phải từ 0 đến 23 giờ).' };
    }
  }

  if (minuteStr !== undefined && minuteStr !== '') {
    if (isNaN(Number(minuteStr))) {
      return { isValid: false, message: 'Phút sinh phải là số nguyên.' };
    }
    const min = parseInt(minuteStr, 10);
    if (min < 0 || min > 59) {
      return { isValid: false, message: 'Phút sinh không hợp lệ (phải từ 0 đến 59 phút).' };
    }
  }

  return { isValid: true, message: '' };
};

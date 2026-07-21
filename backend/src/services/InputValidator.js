/**
 * Centralized Input Validator for Bazi, Ziwei, and Marriage modules.
 * Fast, in-memory validation (sub-millisecond overhead: < 0.005ms).
 */
class InputValidator {
    /**
     * Check if a calendar date actually exists in real life (e.g. rejects Feb 31, Feb 29 non-leap year)
     */
    static isValidRealDate(year, month, day) {
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const d = parseInt(day, 10);

        if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
        if (m < 1 || m > 12) return false;
        if (d < 1 || d > 31) return false;
        if (y < 1900 || y > 2100) return false;

        const dateObj = new Date(Date.UTC(y, m - 1, d));
        if (dateObj.getUTCFullYear() !== y || (dateObj.getUTCMonth() + 1) !== m || dateObj.getUTCDate() !== d) {
            return false;
        }

        // Prevent future dates
        const now = new Date();
        if (dateObj.getTime() > now.getTime()) {
            return false;
        }

        return true;
    }

    /**
     * Validate Bazi Input (date, time, gender, name)
     */
    static validateBaziInput(data) {
        if (!data || typeof data !== 'object') {
            return { isValid: false, error: 'Dữ liệu yêu cầu không hợp lệ.' };
        }

        const { date, time, gender, name } = data;

        // 1. Validate Date (DD/MM/YYYY or YYYY-MM-DD)
        if (!date || typeof date !== 'string') {
            return { isValid: false, error: 'Vui lòng cung cấp ngày sinh.' };
        }

        let day, month, year;
        const trimmedDate = date.trim();
        if (trimmedDate.includes('/')) {
            const parts = trimmedDate.split('/');
            if (parts.length !== 3) {
                return { isValid: false, error: 'Định dạng ngày sinh phải là DD/MM/YYYY.' };
            }
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            year = parseInt(parts[2], 10);
        } else if (trimmedDate.includes('-')) {
            const parts = trimmedDate.split('-');
            if (parts.length !== 3) {
                return { isValid: false, error: 'Định dạng ngày sinh phải là YYYY-MM-DD.' };
            }
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            day = parseInt(parts[2], 10);
        } else {
            return { isValid: false, error: 'Định dạng ngày sinh không hợp lệ (cần dùng DD/MM/YYYY hoặc YYYY-MM-DD).' };
        }

        if (!this.isValidRealDate(year, month, day)) {
            return { isValid: false, error: `Ngày sinh ${trimmedDate} không tồn tại trên thực tế hoặc nằm ngoài khoảng hợp lệ (1900 - hiện tại).` };
        }

        // 2. Validate Time (HH:mm)
        if (!time || typeof time !== 'string') {
            return { isValid: false, error: 'Vui lòng cung cấp giờ sinh.' };
        }

        const timeParts = time.trim().split(':');
        if (timeParts.length < 2) {
            return { isValid: false, error: 'Giờ sinh phải theo định dạng HH:mm.' };
        }

        const hour = parseInt(timeParts[0], 10);
        const minute = parseInt(timeParts[1], 10);

        if (isNaN(hour) || hour < 0 || hour > 23) {
            return { isValid: false, error: 'Giờ sinh không hợp lệ (phải từ 0 đến 23 giờ).' };
        }
        if (isNaN(minute) || minute < 0 || minute > 59) {
            return { isValid: false, error: 'Phút sinh không hợp lệ (phải từ 0 đến 59 phút).' };
        }

        // 3. Validate Gender
        let genderVal;
        if (gender === 1 || gender === '1' || gender === 'Nam' || gender === 'nam') {
            genderVal = 1;
        } else if (gender === 0 || gender === '0' || gender === 'Nữ' || gender === 'nữ' || gender === 'Nu' || gender === 'nu') {
            genderVal = 0;
        } else {
            return { isValid: false, error: 'Giới tính không hợp lệ (chọn Nam hoặc Nữ).' };
        }

        const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        return {
            isValid: true,
            error: null,
            sanitized: {
                date: formattedDate,
                rawDate: trimmedDate,
                time: formattedTime,
                gender: genderVal,
                name: name ? String(name).trim() : ''
            }
        };
    }

    /**
     * Validate Ziwei Input (date, hour, gender, timezone, school, name)
     */
    static validateZiweiInput(data) {
        if (!data || typeof data !== 'object') {
            return { isValid: false, error: 'Dữ liệu yêu cầu không hợp lệ.' };
        }

        const { date, hour, time, gender, timezone = 7, school = 'bac_phai', calendarType = 'solar', name } = data;

        // Date validation (support YYYY-MM-DD and DD/MM/YYYY)
        let day, month, year, dateStr;
        if (!date || typeof date !== 'string') {
            return { isValid: false, error: 'Vui lòng cung cấp ngày sinh YYYY-MM-DD.' };
        }
        
        const trimmedDate = date.trim();
        if (trimmedDate.includes('-')) {
            const parts = trimmedDate.split('-');
            if (parts.length !== 3) return { isValid: false, error: 'Định dạng ngày sinh phải là YYYY-MM-DD.' };
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            day = parseInt(parts[2], 10);
        } else if (trimmedDate.includes('/')) {
            const parts = trimmedDate.split('/');
            if (parts.length !== 3) return { isValid: false, error: 'Định dạng ngày sinh phải là DD/MM/YYYY.' };
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            year = parseInt(parts[2], 10);
        } else {
            return { isValid: false, error: 'Định dạng ngày sinh phải là YYYY-MM-DD.' };
        }

        if (!this.isValidRealDate(year, month, day)) {
            return { isValid: false, error: `Ngày sinh ${trimmedDate} không tồn tại trên thực tế.` };
        }

        // Validate Hour: Ziwei accepts branch index (0..11) or HH:mm time string
        let hr = parseInt(hour, 10);
        if (isNaN(hr) && typeof time === 'string') {
            const tParts = time.trim().split(':');
            const hVal = parseInt(tParts[0], 10);
            if (!isNaN(hVal)) {
                // Convert 24h to 12 Can Chi hour index: Tý (23-1) -> 0, Sửu (1-3) -> 1, ...
                hr = Math.floor((hVal + 1) % 24 / 2);
            }
        }

        if (isNaN(hr) || hr < 0 || hr > 11) {
            return { isValid: false, error: 'Giờ sinh Tử Vi không hợp lệ (phải từ 0 đến 11 tương ứng 12 Can Chi giờ).' };
        }

        // Validate Gender
        let genderStr;
        if (gender === 'Nam' || gender === 1 || gender === '1') {
            genderStr = 'Nam';
        } else if (gender === 'Nữ' || gender === 'Nu' || gender === 0 || gender === '0') {
            genderStr = 'Nữ';
        } else {
            return { isValid: false, error: "Giới tính phải là 'Nam' hoặc 'Nữ'." };
        }

        const tz = parseInt(timezone, 10);
        if (isNaN(tz) || tz < -12 || tz > 14) {
            return { isValid: false, error: 'Múi giờ phải nằm trong khoảng từ -12 đến +14.' };
        }

        const isoDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        return {
            isValid: true,
            error: null,
            sanitized: {
                date: isoDateStr,
                hour: hr,
                gender: genderStr,
                timezone: tz,
                school,
                calendarType,
                name: name ? String(name).trim() : ''
            }
        };
    }

    /**
     * Validate Marriage Input (male and female birth info)
     */
    static validateMarriageInput(data) {
        if (!data || typeof data !== 'object') {
            return { isValid: false, error: 'Dữ liệu yêu cầu không hợp lệ.' };
        }

        const { male, female } = data;
        if (!male || typeof male !== 'object') {
            return { isValid: false, error: 'Vui lòng cung cấp đầy đủ thông tin ngày giờ sinh của Nam.' };
        }
        if (!female || typeof female !== 'object') {
            return { isValid: false, error: 'Vui lòng cung cấp đầy đủ thông tin ngày giờ sinh của Nữ.' };
        }

        const maleCheck = this.validateBaziInput({ ...male, gender: 1 });
        if (!maleCheck.isValid) {
            return { isValid: false, error: `Thông tin Nam không hợp lệ: ${maleCheck.error}` };
        }

        const femaleCheck = this.validateBaziInput({ ...female, gender: 0 });
        if (!femaleCheck.isValid) {
            return { isValid: false, error: `Thông tin Nữ không hợp lệ: ${femaleCheck.error}` };
        }

        return {
            isValid: true,
            error: null,
            sanitized: {
                male: maleCheck.sanitized,
                female: femaleCheck.sanitized
            }
        };
    }

    /**
     * Validate IChing (Kinh Dịch) Input (lines, question)
     */
    static validateIChingInput(data) {
        if (!data || typeof data !== 'object') {
            return { isValid: false, error: 'Dữ liệu yêu cầu không hợp lệ.' };
        }

        const { lines, question } = data;

        // 1. Validate Lines array
        if (!Array.isArray(lines) || lines.length !== 6) {
            return { isValid: false, error: 'Dữ liệu quẻ Kinh Dịch phải có đúng 6 hào.' };
        }

        for (let i = 0; i < 6; i++) {
            const line = lines[i];
            if (!line || typeof line !== 'object') {
                return { isValid: false, error: `Hào thứ ${i + 1} không hợp lệ.` };
            }
            if (line.type !== 0 && line.type !== 1) {
                return { isValid: false, error: `Âm Dương của Hào thứ ${i + 1} phải là 0 (Âm) hoặc 1 (Dương).` };
            }
            if (typeof line.moving !== 'boolean') {
                return { isValid: false, error: `Trạng thái Hào động của Hào thứ ${i + 1} phải là boolean.` };
            }
        }

        // 2. Validate Question string length if provided
        if (question && typeof question === 'string' && question.trim().length > 500) {
            return { isValid: false, error: 'Câu hỏi gieo quẻ không được vượt quá 500 ký tự.' };
        }

        return { isValid: true, error: null };
    }
}

module.exports = InputValidator;

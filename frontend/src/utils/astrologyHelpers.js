export const stemElements = {
    "Giáp": "Moc", "Ất": "Moc", "Bính": "Hoa", "Đinh": "Hoa", "Mậu": "Tho",
    "Kỷ": "Tho", "Canh": "Kim", "Tân": "Kim", "Nhâm": "Thuy", "Quý": "Thuy"
};

export const branchElements = {
    "Tý": "Thuy", "Sửu": "Tho", "Dần": "Moc", "Mão": "Moc", "Thìn": "Tho", "Tỵ": "Hoa",
    "Ngọ": "Hoa", "Mùi": "Tho", "Thân": "Kim", "Dậu": "Kim", "Tuất": "Tho", "Hợi": "Thuy"
};

export const getColorClass = (element) => {
    switch (element) {
        case 'Mộc':
        case 'Moc': return 'text-emerald-600';
        case 'Hỏa':
        case 'Hoa': return 'text-red-600';
        case 'Thổ':
        case 'Tho': return 'text-amber-700';
        case 'Kim': return 'text-slate-500';
        case 'Thủy':
        case 'Thuy': return 'text-blue-600';
        default: return 'text-gray-800';
    }
};

export const getBgColorClass = (element) => {
    switch (element) {
        case 'Mộc':
        case 'Moc': return 'bg-emerald-50 border-emerald-200';
        case 'Hỏa':
        case 'Hoa': return 'bg-red-50 border-red-200';
        case 'Thổ':
        case 'Tho': return 'bg-amber-50 border-amber-200';
        case 'Kim': return 'bg-slate-50 border-slate-200';
        case 'Thủy':
        case 'Thuy': return 'bg-blue-50 border-blue-200';
        default: return 'bg-gray-50 border-gray-200';
    }
};

export const HAO_VI_MEANING = {
    1: { ten: 'Sơ Hào (初爻)', y_nghia: 'Khởi đầu, nền móng, tiềm ẩn', dai_dien: 'Trẻ em, người nhỏ, chân, tầng thấp, đất' },
    2: { ten: 'Nhị Hào (二爻)', y_nghia: 'Bản thân chủ thể, trung tâm nội quái', dai_dien: 'Bản thân, người trong nhà, nội tình, bụng' },
    3: { ten: 'Tam Hào (三爻)', y_nghia: 'Giao điểm nội-ngoại, vị trí bất ổn', dai_dien: 'Anh em, cửa ngõ, sự chuyển tiếp, đùi gối' },
    4: { ten: 'Tứ Hào (四爻)', y_nghia: 'Bước vào ngoại quái, quan hệ bên ngoài', dai_dien: 'Quan lại, người có quyền lực, ngực vai' },
    5: { ten: 'Ngũ Hào (五爻)', y_nghia: 'Vị tôn quý nhất — Thiên Tử vị', dai_dien: 'Lãnh đạo, vua, cha/mẹ, đầu mặt, địa vị cao' },
    6: { ten: 'Thượng Hào (上爻)', y_nghia: 'Hoàn thành, cực đỉnh, vượt giới hạn', dai_dien: 'Người già, tổ tiên, trời, vị trí cuối cùng' },
};

export const getChiOnly = (stemBranch) => {
    if (!stemBranch) return '';
    const parts = stemBranch.trim().split(' ');
    return parts.length >= 2 ? parts[parts.length - 1] : stemBranch;
};

export const formatThan = (thanStr) => {
    if (thanStr === 'vuong') return 'Thân Vượng';
    if (thanStr === 'nhuoc') return 'Thân Nhược';
    if (thanStr === 'can_bang') return 'Trạng Thái Cân Bằng';
    if (thanStr === 'tong_cach') return 'Tòng Cách';
    return thanStr;
};

export const formatElement = (el) => {
    switch (el) {
        case 'Moc': return 'Mộc';
        case 'Hoa': return 'Hỏa';
        case 'Tho': return 'Thổ';
        case 'Kim': return 'Kim';
        case 'Thuy': return 'Thủy';
        default: return el;
    }
};

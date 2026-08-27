import React from 'react';
import Tooltip from '../Tooltip';
import {
    stemElements,
    branchElements,
    getColorClass
} from '../../utils/astrologyHelpers';

export const getSeasonColorClass = (tietKhi) => {
    if (!tietKhi) return 'text-amber-800';
    const cleanName = tietKhi.replace('Tiết ', '').trim();
    const spring = ['Lập Xuân', 'Vũ Thủy', 'Kinh Trập', 'Xuân Phân', 'Thanh Minh', 'Cốc Vũ'];
    const summer = ['Lập Hạ', 'Tiểu Mãn', 'Mang Chủng', 'Hạ Chí', 'Tiểu Thử', 'Đại Thử'];
    const autumn = ['Lập Thu', 'Xử Thử', 'Bạch Lộ', 'Thu Phân', 'Hàn Lộ', 'Sương Giáng'];
    const winter = ['Lập Đông', 'Tiểu Tuyết', 'Đại Tuyết', 'Đông Chí', 'Tiểu Hàn', 'Đại Hàn'];

    if (spring.includes(cleanName)) return 'text-emerald-600';
    if (summer.includes(cleanName)) return 'text-rose-600';
    if (autumn.includes(cleanName)) return 'text-amber-700';
    if (winter.includes(cleanName)) return 'text-blue-600';
    return 'text-amber-800';
};

export const getRemedyData = (element) => {
    if (!element) return null;
    const normalizedKey = {
        'Mộc': 'Moc', 'Moc': 'Moc', 'mộc': 'Moc', 'moc': 'Moc',
        'Hỏa': 'Hoa', 'Hoa': 'Hoa', 'hỏa': 'Hoa', 'hoa': 'Hoa',
        'Thổ': 'Tho', 'Tho': 'Tho', 'thổ': 'Tho', 'tho': 'Tho',
        'Kim': 'Kim', 'kim': 'Kim',
        'Thủy': 'Thuy', 'Thuy': 'Thuy', 'thủy': 'Thuy', 'thuy': 'Thuy'
    }[element] || element;

    const remedies = {
        'Moc': {
            colors: "Xanh lá cây, xanh lục, xanh ngọc, xanh bộ đội.",
            directions: "Đông, Đông Nam (tương ứng cung Chấn, Tốn).",
            careers: "Lâm nghiệp, chế biến gỗ, nông nghiệp, giáo dục, viết lách, y dược, dệt may, thiết kế thời trang.",
            items: "Vòng dâu tằm, trang sức đá Thạch Anh Xanh (Aventurine), Ngọc Cẩm Thạch, Ngọc Bích, trồng nhiều cây xanh."
        },
        'Hoa': {
            colors: "Đỏ, hồng, tím, cam, đỏ rực.",
            directions: "Nam (tương ứng cung Ly).",
            careers: "Công nghệ thông tin, điện tử, viễn thông, ẩm thực, năng lượng, nhà hàng, mỹ phẩm, nghệ thuật, nhiếp ảnh.",
            items: "Trang sức đá Thạch Anh Hồng, đá Ruby, Thạch Anh Tím, đá Mắt Hổ Đỏ, dùng nến thơm hoặc đèn ấm trong nhà."
        },
        'Tho': {
            colors: "Vàng, nâu đất, cam đất, vàng cát.",
            directions: "Trung cung (trung tâm), Đông Bắc, Tây Nam.",
            careers: "Bất động sản, xây dựng, kiến trúc, khai khoáng, gốm sứ, nông nghiệp sạch, quản trị nhân sự, luật pháp.",
            items: "Trang sức đá Thạch Anh Vàng (Citrine), Thạch Anh Tóc Vàng, đá Mắt Hổ Vàng Nâu, bài trí đồ gốm sứ thủ công."
        },
        'Kim': {
            colors: "Trắng, xám, ghi, vàng ánh kim, bạc.",
            directions: "Tây, Tây Bắc (tương ứng cung Đoài, Càn).",
            careers: "Cơ khí, kim khí, tài chính, ngân hàng, trang sức, công nghệ cao, hành chính công, quân sự, thiết bị y tế.",
            items: "Trang sức bạc, vàng trắng, đá Thạch Anh Trắng, Thạch Anh Khói, đá Mặt Trăng (Moonstone), trang sức kim loại."
        },
        'Thuy': {
            colors: "Đen, xanh dương, xanh nước biển, xanh navy.",
            directions: "Bắc (tương ứng cung Khảm).",
            careers: "Vận tải, du lịch, thủy hải sản, ngoại giao, báo chí, truyền thông, dịch vụ khách hàng, hóa chất, giặt ủi.",
            items: "Trang sức đá Obsidian Đen, Thạch Anh Tóc Đen, Aquamarine, đặt bể cá cảnh hoặc thác nước phong thủy mini."
        }
    };
    return remedies[normalizedKey] || null;
};

export const renderCanChiSpans = (canChiStr) => {
    if (!canChiStr) return '';
    const parts = canChiStr.trim().split(/\s+/);
    if (parts.length !== 2) return <span className="font-extrabold">{canChiStr}</span>;
    const [gan, zhi] = parts;
    const ganElem = stemElements[gan];
    const zhiElem = branchElements[zhi];
    return (
        <span className="font-extrabold inline-flex items-center">
            <Tooltip term={gan} unstyled={true}>
                <span className={`hover:scale-105 transition-transform inline-block ${getColorClass(ganElem)}`}>{gan}</span>
            </Tooltip>
            <span className="text-slate-400 font-normal mx-0.5">&nbsp;</span>
            <Tooltip term={zhi} unstyled={true}>
                <span className={`hover:scale-105 transition-transform inline-block ${getColorClass(zhiElem)}`}>{zhi}</span>
            </Tooltip>
        </span>
    );
};

export const getNaYinTextColorClass = (naYinText) => {
    if (!naYinText) return 'text-slate-800';
    const cleanText = naYinText.trim();
    const words = cleanText.split(/\s+/);
    const lastWord = words[words.length - 1];
    
    if (lastWord.includes('Kim')) return 'text-slate-500 font-extrabold';
    if (lastWord.includes('Mộc') || lastWord.includes('Moc') || lastWord.includes('Lâm')) return 'text-emerald-600 font-extrabold';
    if (lastWord.includes('Thủy') || lastWord.includes('Thuỷ') || lastWord.includes('Hải')) return 'text-blue-600 font-extrabold';
    if (lastWord.includes('Hỏa') || lastWord.includes('Hoả')) return 'text-red-600 font-extrabold';
    if (lastWord.includes('Thổ') || lastWord.includes('Thô')) return 'text-amber-800 font-extrabold';
    
    if (cleanText.includes('Kim')) return 'text-slate-500 font-extrabold';
    if (cleanText.includes('Mộc') || cleanText.includes('Moc')) return 'text-emerald-600 font-extrabold';
    if (cleanText.includes('Thủy') || cleanText.includes('Thuỷ')) return 'text-blue-600 font-extrabold';
    if (cleanText.includes('Hỏa') || cleanText.includes('Hoả')) return 'text-red-600 font-extrabold';
    if (cleanText.includes('Thổ') || cleanText.includes('Thô')) return 'text-amber-800 font-extrabold';
    return 'text-slate-800';
};

export const cleanLunarDate = (lunarStr) => {
    if (!lunarStr) return '';
    return lunarStr
        .replace(/ngày\s+/i, '')
        .replace(/\s*tháng\s*/i, '/')
        .replace(/\s*năm\s*/i, '/')
        .replace(/\s*Âm\s+lịch/i, '')
        .trim();
};

export const getNaYinColorClass = (naYinText) => {
    if (!naYinText) return 'text-slate-500 bg-slate-100/80 border-slate-200/40';
    if (naYinText.includes('Kim')) return 'text-slate-700 bg-slate-100 border-slate-350';
    if (naYinText.includes('Mộc')) return 'text-emerald-700 bg-emerald-50 border-emerald-250/30';
    if (naYinText.includes('Thủy')) return 'text-blue-700 bg-blue-50 border-blue-200/40';
    if (naYinText.includes('Hỏa')) return 'text-red-700 bg-red-50 border-red-200/40';
    if (naYinText.includes('Thổ')) return 'text-amber-800 bg-amber-50/60 border-amber-250/30';
    return 'text-slate-500 bg-slate-100/80 border-slate-200/40';
};

export const getAbbreviatedTruongSinh = (name) => {
    if (!name) return '';
    const abbrev = {
        'Trường Sinh': 'T.Sinh',
        'Mộc Dục': 'M.Dục',
        'Quan Đới': 'Q.Đới',
        'Lâm Quan': 'L.Quan',
        'Đế Vượng': 'Đ.Vượng',
        'Suy': 'Suy',
        'Bệnh': 'Bệnh',
        'Tử': 'Tử',
        'Mộ': 'Mộ',
        'Tuyệt': 'Tuyệt',
        'Thai': 'Thai',
        'Dưỡng': 'Dưỡng'
    };
    return abbrev[name] || name;
};

export const getAbbreviatedThapThan = (name) => {
    if (!name) return '';
    const trimmed = name.trim();
    const map = {
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
    return map[trimmed] || trimmed;
};

export const SHEN_SHA_COLORS = {
    'Thiên Ất': 'text-emerald-600',
    'Thiên Ất Quý Nhân': 'text-emerald-600',
    'Thái Cực': 'text-emerald-600',
    'Thái Cực Quý Nhân': 'text-emerald-600',
    'Thiên Đức': 'text-emerald-600',
    'Thiên Đức Quý Nhân': 'text-emerald-600',
    'Nguyệt Đức': 'text-emerald-600',
    'Nguyệt Đức Quý Nhân': 'text-emerald-600',
    'Lộc Thần': 'text-emerald-600',
    'Tuế Lộc': 'text-emerald-600',
    'Kiến Lộc': 'text-emerald-600',
    'Chuyên Lộc': 'text-emerald-600',
    'Quy Lộc': 'text-emerald-600',
    'Văn Xương': 'text-emerald-600',
    'Văn Xương Quý Nhân': 'text-emerald-600',
    'Học Đường': 'text-emerald-600',
    'Học Đường Quý Nhân': 'text-emerald-600',
    'Từ Quán': 'text-emerald-600',
    'Từ Quán Quý Nhân': 'text-emerald-600',
    'Tướng Tinh': 'text-emerald-600',
    'Phúc Tinh': 'text-emerald-600',
    'Phúc Tinh Quý Nhân': 'text-emerald-600',
    'Thiên Y': 'text-emerald-600',
    'Quốc Ấn': 'text-emerald-600',
    'Quốc Ấn Quý Nhân': 'text-emerald-600',
    'Thiên Trù': 'text-emerald-600',
    'Thiên Trù Quý Nhân': 'text-emerald-600',
    'Đường Phù': 'text-emerald-600',
    'Thiên Hỷ': 'text-emerald-600',
    'Thiên Hỷ Quý Nhân': 'text-emerald-600',
    'Kim Dư': 'text-emerald-600',
    'Kim Dư Quý Nhân': 'text-emerald-600',
    'Thiên Xá': 'text-emerald-600',
    'Âm Chú Dương Thụ': 'text-emerald-600',
    'Thiên Thượng Tam Kỳ': 'text-emerald-600',
    'Địa Thượng Tam Kỳ': 'text-emerald-600',
    'Nhân Gian Tam Kỳ': 'text-emerald-600',
    'Đào Hoa': 'text-purple-600',
    'Hàm Trì': 'text-purple-600',
    'Hồng Loan': 'text-purple-600',
    'Đào Hoa Sát': 'text-purple-600',
    'Cửu Xửu': 'text-purple-600',
    'Cửu Xửu Đào Hoa': 'text-purple-600',
    'Mộc Dục Đào Hoa': 'text-purple-600',
    'Tường Ngoại Đào Hoa': 'text-purple-600',
    'Dương Nhận': 'text-red-600 font-bold',
    'Phi Nhận': 'text-red-600',
    'Kiếp Sát': 'text-red-600',
    'Tai Sát': 'text-red-600',
    'Tuế Sát': 'text-red-600',
    'Địa Sát': 'text-red-600',
    'Vong Thần': 'text-red-600',
    'Thập Ác Đại Bại': 'text-red-600',
    'Nguyên Thần': 'text-red-600',
    'Đại Hao': 'text-red-600',
    'Tiểu Hao': 'text-red-600',
    'Quải Đề': 'text-red-600',
    'Quải Đề Sát': 'text-red-600',
    'Tang Môn': 'text-red-600',
    'Bạch Hổ': 'text-red-600',
    'Điếu Khách': 'text-red-600',
    'Bệnh Phù': 'text-red-600',
    'Quan Phù': 'text-red-600',
    'Phục Binh': 'text-red-600',
    'Phá Toái': 'text-red-600',
    'Thiên Cương': 'text-red-600',
    'Huyết Nhận': 'text-red-600',
    'Lưu Hà': 'text-red-600',
    'Hồng Diễm': 'text-red-600',
    'Âm Dương Sát': 'text-red-600',
    'Hoa Cái': 'text-amber-600',
    'Dịch Mã': 'text-amber-600',
    'Không Vong': 'text-amber-600',
    'Tuần Không': 'text-amber-600',
    'Triệt Không': 'text-amber-600',
    'Cô Thần': 'text-amber-600',
    'Quả Tú': 'text-amber-600',
    'Cơ Nối': 'text-amber-600',
    'Thiên La': 'text-amber-600',
    'Địa Võng': 'text-amber-600',
    'Thiên La Địa Võng': 'text-amber-600',
    'Thập Linh': 'text-amber-600',
    'Thập Linh Nhật': 'text-amber-600',
    'Kim Thần': 'text-amber-600',
    'Quái Khí': 'text-amber-600',
    'Bát Chuyên': 'text-amber-600',
    'Cửu Tiêu': 'text-amber-600'
};

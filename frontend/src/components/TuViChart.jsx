import React, { useState } from 'react';
import { Calendar, User, Sparkles } from 'lucide-react';

const GRID_COORDINATES = {
  "Dần": { row: 4, col: 1 },
  "Mão": { row: 3, col: 1 },
  "Thìn": { row: 2, col: 1 },
  "Tỵ": { row: 1, col: 1 },
  "Ngọ": { row: 1, col: 2 },
  "Mùi": { row: 1, col: 3 },
  "Thân": { row: 1, col: 4 },
  "Dậu": { row: 2, col: 4 },
  "Tuất": { row: 3, col: 4 },
  "Hợi": { row: 4, col: 4 },
  "Tý": { row: 4, col: 3 },
  "Sửu": { row: 4, col: 2 }
};

// Bảng màu cho Tứ Hóa
const MUTAGEN_STYLES = {
  "hoa_loc": "bg-emerald-50 text-emerald-600 border-emerald-100",
  "hoa_quyen": "bg-amber-50 text-amber-600 border-amber-100",
  "hoa_khoa": "bg-blue-50 text-blue-600 border-blue-100",
  "hoa_ky": "bg-rose-50 text-rose-600 border-rose-100"
};

const MUTAGEN_LABELS = {
  "hoa_loc": "Lộc",
  "hoa_quyen": "Quyền",
  "hoa_khoa": "Khoa",
  "hoa_ky": "Kỵ"
};

const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

// Tra cứu Ngũ Hành của các Tinh Tú trong Tử Vi
const STAR_ELEMENTS = {
  // Chính tinh
  "Tử Vi": "Thổ", "Thiên Phủ": "Thổ", "Vũ Khúc": "Kim", "Thiên Tướng": "Thủy",
  "Thái Dương": "Hỏa", "Cự Môn": "Thủy", "Thiên Cơ": "Mộc", "Thiên Đồng": "Thủy",
  "Thái Âm": "Thủy", "Thiên Lương": "Mộc", "Thất Sát": "Kim", "Phá Quân": "Thủy",
  "Tham Lang": "Thủy", "Liêm Trinh": "Hỏa",
  // Lục cát tinh
  "Văn Xương": "Kim", "Văn Khúc": "Thủy", "Thiên Khôi": "Hỏa", "Thiên Việt": "Hỏa",
  "Tả Phù": "Thổ", "Hữu Bật": "Thủy",
  // Lục sát tinh
  "Kình Dương": "Kim", "Đà La": "Kim", "Hỏa Tinh": "Hỏa", "Linh Tinh": "Hỏa",
  "Địa Không": "Hỏa", "Địa Kiếp": "Hỏa",
  // Tạp tinh & vòng Bác Sĩ, Tuế Tiền, Tướng Tinh
  "Lộc Tồn": "Thổ", "Thiên Mã": "Hỏa", "Hóa Lộc": "Mộc", "Hóa Quyền": "Thủy",
  "Hóa Khoa": "Mộc", "Hóa Kỵ": "Thủy", "Đào Hoa": "Mộc", "Hồng Loan": "Thủy",
  "Thiên Hỷ": "Thủy", "Hỷ Thần": "Hỏa", "Thiên Khốc": "Thủy", "Thiên Hư": "Thủy",
  "Thiên Hình": "Hỏa", "Thiên Diêu": "Thủy", "Cô Thần": "Thổ", "Quả Tú": "Thổ",
  "Bác Sĩ": "Thủy", "Bác Sỹ": "Thủy", "Lực Sĩ": "Hỏa", "Thanh Long": "Thủy",
  "Tiểu Hao": "Hỏa", "Đại Hao": "Hỏa", "Tướng Quân": "Mộc", "Tấu Thư": "Kim",
  "Trực Phù": "Hỏa", "Đường Phù": "Mộc", "Quốc Ấn": "Thổ", "Tam Thai": "Thủy",
  "Bát Tọa": "Thổ", "Phong Cáo": "Thổ", "Thiên Tài": "Thổ", "Thiên Thọ": "Thổ",
  "Thiên Quan": "Hỏa", "Thiên Phúc": "Thổ", "Thiên Đức": "Thủy", "Thiên Quý": "Thổ",
  "Tuần Không": "Hỏa", "Triệt Lộ": "Kim", "Triệt": "Kim", "Tuần": "Hỏa", "Bệnh Phù": "Thổ",
  "Tang Môn": "Mộc", "Bạch Hổ": "Kim", "Điếu Khách": "Hỏa", "Quan Phù": "Hỏa",
  "Giải Thần": "Mộc", "Phượng Các": "Thổ", "Phượng các": "Thổ", "Long Trì": "Thủy",
  "Bát tòa": "Thổ", "Thiên trù": "Thổ", "Thiên Trù": "Thổ", "Bát Tọa": "Thổ",
  "Kiếp Sát": "Hỏa", "Thương Y": "Thủy", "Thiên Không": "Hỏa", "Thiên Quý": "Thổ",
  "Tướng tinh": "Mộc", "Lưu Niên": "Thổ", "Bệnh": "Thủy", "Tử": "Thủy", "Mộ": "Thổ",
  "Tuyệt": "Thủy", "Thai": "Thổ", "Dưỡng": "Mộc", "Trường Sinh": "Thủy",
  "Mộc Dục": "Thủy", "Mục Dục": "Thủy", "Quan Đới": "Kim", "Lâm Quan": "Kim",
  "Đế Vượng": "Kim", "Suy": "Thủy"
};

// CSS class tương ứng màu sắc Ngũ Hành
const ELEMENT_COLORS = {
  "Kim": "text-slate-500",      // Xám ghi
  "Mộc": "text-emerald-700",    // Xanh lá cây
  "Thủy": "text-neutral-900",   // Đen mặc định
  "Hỏa": "text-rose-600",       // Đỏ
  "Thổ": "text-amber-600"       // Vàng cam
};

// Tra cứu Ngũ Hành của 12 Địa Chi
const BRANCH_ELEMENTS = {
  "Tý": "Thủy", "Hợi": "Thủy",
  "Dần": "Mộc", "Mão": "Mộc",
  "Tỵ": "Hỏa", "Ngọ": "Hỏa",
  "Thân": "Kim", "Dậu": "Kim",
  "Thìn": "Thổ", "Tuất": "Thổ", "Sửu": "Thổ", "Mùi": "Thổ"
};

// Phân loại Cát/Sát tinh để chia cột
const AUSPICIOUS_STARS = new Set([
  "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Tả Phù", "Hữu Bật",
  "Lộc Tồn", "Thiên Mã", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Giải Thần",
  "Đường Phù", "Quốc Ấn", "Tam Thai", "Bát Tọa", "Thiên Hỷ", "Hỷ Thần",
  "Phượng Các", "Phượng các", "Thanh Long", "Tướng Quân", "Bác Sĩ", "Bác Sỹ", "Lực Sĩ",
  "Tấu Thư", "Trực Phù", "Thiên Quan", "Thiên Phúc", "Thiên Quý", "Thiên Đức",
  "Nguyệt Đức", "Long Đức", "Phúc Đức", "Đào Hoa", "Hồng Loan", "Thiên Tài",
  "Thiên Thọ", "Phong Cáo", "Nguyệt Giải", "Thai Phụ", "Long Trì", "Thiên Trù",
  "Sinh Lực", "Phúc Tinh", "Cát Tánh", "LN Văn tinh", "LN Văn Tinh", "Bát tòa",
  "Thiên trù", "Bát Tọa", "Thiên Trù"
]);

const isStarAuspicious = (name) => {
  if (AUSPICIOUS_STARS.has(name)) return true;
  const lower = name.toLowerCase();
  if (lower.includes("không") || lower.includes("kiếp") || lower.includes("kình") || 
      lower.includes("đà") || lower.includes("hỏa") || lower.includes("linh") || 
      lower.includes("khốc") || lower.includes("hư") || lower.includes("hình") || 
      lower.includes("sát") || lower.includes("diêu") || lower.includes("cô") || 
      lower.includes("quả") || lower.includes("toái") || lower.includes("phá") || 
      lower.includes("hao") || lower.includes("tang") || lower.includes("hổ") || 
      lower.includes("khách") || lower.includes("la") || lower.includes("võng") || 
      lower.includes("triệt") || lower.includes("tuần") || lower.includes("bệnh") || 
      lower.includes("tử") || lower.includes("kỵ") || lower.includes("hao")) {
    return false;
  }
  if (lower.includes("lộc") || lower.includes("quyền") || lower.includes("khoa") || 
      lower.includes("trì") || lower.includes("hỷ") || lower.includes("giải") || 
      lower.includes("phúc") || lower.includes("đức") || lower.includes("long") || 
      lower.includes("phượng") || lower.includes("thanh") || lower.includes("trù") || 
      lower.includes("quý") || lower.includes("thọ") || lower.includes("đế")) {
    return true;
  }
  return true; // Mặc định cho cột bên trái
};

// Viết tắt Thiên Can: Giáp -> G., Ất -> Ấ., Bính -> B., Đinh -> Đ., Mậu -> M., Kỷ -> K., Canh -> C., Tân -> T., Nhâm -> N., Quý -> Q.
const formatAbbreviatedStemBranch = (stem, branch) => {
  const stemMap = {
    "Giáp": "G.", "Ất": "Ấ.", "Bính": "B.", "Đinh": "Đ.", "Mậu": "M.",
    "Kỷ": "K.", "Canh": "C.", "Tân": "T.", "Nhâm": "N.", "Quý": "Q."
  };
  const abbr = stemMap[stem] || stem;
  return `${abbr}${branch}`;
};

const getElementHighlight = (fiveElementsClass) => {
  if (!fiveElementsClass) return "ring-amber-400 bg-amber-50/10 border-amber-200";
  if (fiveElementsClass.includes("Kim")) return "ring-slate-400 bg-slate-50/10 border-slate-300";
  if (fiveElementsClass.includes("Mộc")) return "ring-emerald-500 bg-emerald-50/10 border-emerald-300";
  if (fiveElementsClass.includes("Thủy")) return "ring-neutral-900 bg-neutral-50/10 border-neutral-300";
  if (fiveElementsClass.includes("Hỏa")) return "ring-rose-500 bg-rose-50/10 border-rose-300";
  if (fiveElementsClass.includes("Thổ")) return "ring-amber-500 bg-amber-50/10 border-amber-300";
  return "ring-amber-400 bg-amber-50/10 border-amber-200";
};

// Tối ưu hóa hiệu năng re-render bằng React.memo cho từng ô cung Tử Vi
const PalaceCell = React.memo(({ palace, elementHighlight }) => {
  const { row, col } = GRID_COORDINATES[palace.earthlyBranch] || { row: 1, col: 1 };
  const isMệnh = palace.name === "Mệnh" || palace.name === "MỆNH";
  const isSpecial = isMệnh || palace.isBodyPalace;

  const branchIdx = BRANCHES.indexOf(palace.earthlyBranch);
  const tieuHanIdx = (branchIdx - 2 + 12) % 12;
  const tieuHanBranch = BRANCHES[tieuHanIdx];

  const currentYear = new Date().getFullYear();
  const currentYearBranchIdx = (currentYear - 4) % 12;
  const nguyetHanMonth = (branchIdx - currentYearBranchIdx + 12) % 12 + 1;
  const nguyetHanText = `Th.${nguyetHanMonth}`;

  // Chuẩn hóa tên Mộc Dục
  const cleanChangsheng = (name) => {
    if (name === "Mục Dục") return "Mộc Dục";
    return name;
  };

  // Tổng hợp và loại bỏ trùng lặp tạp tinh để hiển thị cột
  const allOtherStars = [
    ...palace.minorStars.map(s => ({ name: s.name, brightness: s.brightness, mutagen: s.mutagen })),
    ...palace.adjectiveStars.map(s => ({ name: s.name, brightness: "", mutagen: "" }))
  ];

  const majorNames = new Set(palace.majorStars.map(s => s.name));
  const filteredMinorStars = allOtherStars.filter(s => !majorNames.has(s.name));

  // Tách biệt Cát tinh (Trái) và Sát tinh (Phải)
  const leftColumnStars = [];
  const rightColumnStars = [];

  filteredMinorStars.forEach(s => {
    if (isStarAuspicious(s.name)) {
      leftColumnStars.push(s);
    } else {
      rightColumnStars.push(s);
    }
  });

  // Tên cung mệnh (PHU THÊ, MỆNH...) cũng phải theo ngũ hành của cung đó (dựa vào địa chi bản cung)
  const branchEl = BRANCH_ELEMENTS[palace.earthlyBranch] || "Thủy";
  const branchColorClass = ELEMENT_COLORS[branchEl] || "text-neutral-900";

  // Xác định màu ngũ hành cho Địa Chi Tiểu Hạn ở góc dưới bên trái
  const tieuHanEl = BRANCH_ELEMENTS[tieuHanBranch] || "Thủy";
  const tieuHanColorClass = ELEMENT_COLORS[tieuHanEl] || "text-neutral-900";

  return (
    <div
      style={{ gridRow: row, gridColumn: col }}
      className={`p-1 md:p-2.5 min-h-[110px] md:min-h-[160px] flex flex-col justify-between bg-white/70 backdrop-blur-md border rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/5 hover:border-purple-300 hover:-translate-y-0.5 hover:z-30 group relative aspect-[3/4] md:aspect-square ${
        isSpecial ? '' : 'border-purple-100/60'
      } ${
        isMệnh 
          ? `ring-2 ${elementHighlight} z-20` 
          : palace.isBodyPalace 
            ? 'ring-2 ring-indigo-400 bg-indigo-50/10 border-indigo-200 z-20' 
            : ''
      }`}
    >
      {/* 1. ĐỈNH CUNG (TOP ROW - GRID 3 CỘT ĐỂ CĂN GIỮA TUYỆT ĐỐI) */}
      <div className="grid grid-cols-3 items-center border-b border-purple-50 pb-1 mb-1 text-[8.5px] md:text-[11px] leading-tight select-none w-full">
        {/* Đỉnh trái: Can Chi Cung viết tắt (màu đen mặc định) */}
        <span className="text-left font-bold text-slate-800 tracking-tight">
          {formatAbbreviatedStemBranch(palace.heavenlyStem, palace.earthlyBranch)}
        </span>

        {/* Đỉnh giữa: Tên cung (in hoa đậm, CĂN GIỮA TUYỆT ĐỐI, theo ngũ hành bản cung) */}
        <span className={`text-center font-black uppercase tracking-tight text-[9px] md:text-[13px] whitespace-nowrap ${branchColorClass}`}>
          {palace.name}
          {palace.isBodyPalace && <span className="text-[7.5px] md:text-[9.5px] ml-0.5 font-extrabold">(Thân)</span>}
        </span>

        {/* Đỉnh phải: Số Đại Hạn tuổi khởi đầu */}
        <span className="text-right font-extrabold text-slate-500">
          {palace.decadal && palace.decadal.range ? palace.decadal.range[0] : ""}
        </span>
      </div>

      {/* 2. CHÍNH TINH (CĂN GIỮA TO ĐẬM) */}
      {palace.majorStars.length > 0 ? (
        <div className="flex flex-col items-center justify-center gap-0.5 my-1.5 shrink-0 select-none">
          {palace.majorStars.map((star, idx) => {
            const el = STAR_ELEMENTS[star.name] || "Thủy";
            const colorClass = ELEMENT_COLORS[el] || "text-neutral-900";
            return (
              <div key={idx} className="flex items-center gap-0.5 leading-none">
                <span className={`font-black text-[10px] md:text-[13.5px] tracking-tight group-hover:scale-105 transition-transform ${colorClass}`} title={`${star.name} (${el})`}>
                  {star.name}
                  {star.brightness && (
                    <span className="text-[8px] md:text-[9.5px] text-slate-400 font-bold ml-0.5">({star.brightness})</span>
                  )}
                </span>
                {star.mutagen && (
                  <span className={`text-[7px] md:text-[8.5px] px-0.5 rounded border font-black uppercase tracking-wider ${MUTAGEN_STYLES[star.mutagen]}`}>
                    {MUTAGEN_LABELS[star.mutagen]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="my-1 shrink-0 flex items-center justify-center select-none">
          <span className="text-[9px] md:text-[11px] text-slate-300 font-extrabold tracking-widest">VÔ CHÍNH DIỆU</span>
        </div>
      )}

      {/* 3. THÂN CUNG (CHIA ĐÔI 2 BÊN TRÁI PHẢI, CĂN DẠT RA BIÊN) */}
      <div className="flex-1 grid grid-cols-2 gap-x-1.5 gap-y-0.5 overflow-y-auto max-h-[85px] pr-0.5 custom-scrollbar border-t border-purple-50/40 pt-1 mt-1 text-[7.5px] md:text-[9.5px] leading-tight select-none w-full">
        {/* Cột Trái: Cát tinh (Căn lề trái) */}
        <div className="flex flex-col gap-0.5 items-start text-left w-full border-r border-purple-50/20 pr-0.5">
          {leftColumnStars.map((star, idx) => {
            const el = STAR_ELEMENTS[star.name] || "Thủy";
            const colorClass = ELEMENT_COLORS[el] || "text-neutral-900";
            return (
              <span key={idx} className={`font-semibold tracking-tight ${colorClass} w-full`} title={`${star.name} (${el})`}>
                {star.name}
                {star.brightness && (
                  <span className="text-[6.5px] md:text-[7.5px] text-slate-400 font-medium ml-0.5">({star.brightness})</span>
                )}
              </span>
            );
          })}
        </div>

        {/* Cột Phải: Sát tinh (Căn lề phải) */}
        <div className="flex flex-col gap-0.5 items-end text-right w-full pl-0.5">
          {rightColumnStars.map((star, idx) => {
            const el = STAR_ELEMENTS[star.name] || "Thủy";
            const colorClass = ELEMENT_COLORS[el] || "text-neutral-900";
            return (
              <span key={idx} className={`font-semibold tracking-tight ${colorClass} w-full`} title={`${star.name} (${el})`}>
                {star.name}
                {star.brightness && (
                  <span className="text-[6.5px] md:text-[7.5px] text-slate-400 font-medium ml-0.5">({star.brightness})</span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* 4. ĐÁY CUNG (BOTTOM ROW) */}
      <div className="border-t border-purple-50/40 pt-1 mt-1 text-[8px] md:text-[10px] select-none flex justify-between items-center leading-none">
        {/* Đáy trái: Địa chi đơn của TIỂU HẠN (tô màu theo Ngũ Hành Địa Chi của Tiểu Hạn) */}
        <span className={`font-black ${tieuHanColorClass}`} title={`${tieuHanBranch} (${tieuHanEl})`}>
          {tieuHanBranch}
        </span>

        {/* Đáy giữa: Tên vòng Trường sinh (Mộc Dục) */}
        <span className="font-semibold text-slate-500">
          {cleanChangsheng(palace.changsheng12)}
        </span>

        {/* Đáy phải: Chỉ số Nguyệt Hạn (màu xanh tím mặc định) */}
        <span className="font-extrabold text-indigo-700 bg-indigo-50/80 px-1 rounded border border-indigo-100/30">
          {nguyetHanText}
        </span>
      </div>
    </div>
  );
});

const PalaceListView = ({ palaces, elementHighlight }) => {
  return (
    <div className="space-y-4 w-full">
      {palaces.map((palace, idx) => {
        const branchEl = BRANCH_ELEMENTS[palace.earthlyBranch] || "Thủy";
        const branchColorClass = ELEMENT_COLORS[branchEl] || "text-neutral-900";
        const isMệnh = palace.name === "Mệnh" || palace.name === "MỆNH";
        
        // Group minor & adjective stars
        const allOtherStars = [
          ...palace.minorStars.map(s => ({ name: s.name, brightness: s.brightness, mutagen: s.mutagen })),
          ...palace.adjectiveStars.map(s => ({ name: s.name, brightness: "", mutagen: "" }))
        ];
        
        const majorNames = new Set(palace.majorStars.map(s => s.name));
        const filteredMinorStars = allOtherStars.filter(s => !majorNames.has(s.name));
        
        const leftStars = filteredMinorStars.filter(s => isStarAuspicious(s.name));
        const rightStars = filteredMinorStars.filter(s => !isStarAuspicious(s.name));

        return (
          <div 
            key={idx} 
            className={`p-4 bg-white/95 rounded-2xl border border-purple-100/80 shadow-sm flex flex-col gap-3 transition-all ${
              isMệnh ? `ring-2 ${elementHighlight} bg-purple-50/10` : ''
            }`}
          >
            {/* Header: Palace Name, Can Chi, Age */}
            <div className="flex justify-between items-center border-b border-purple-50 pb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black uppercase tracking-wider ${branchColorClass}`}>
                  {palace.name}
                  {palace.isBodyPalace && <span className="text-xs ml-1 font-extrabold">(Thân)</span>}
                </span>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                  {palace.heavenlyStem} {palace.earthlyBranch}
                </span>
              </div>
              <span className="text-xs font-extrabold text-slate-500">
                {palace.decadal && palace.decadal.range ? `Đại hạn: ${palace.decadal.range[0]}t` : ""}
              </span>
            </div>

            {/* Content: Major and Minor Stars */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Major Stars */}
              {palace.majorStars.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-slate-400">Chính tinh:</span>
                  {palace.majorStars.map((star, sIdx) => {
                    const el = STAR_ELEMENTS[star.name] || "Thủy";
                    const colorClass = ELEMENT_COLORS[el] || "text-neutral-900";
                    return (
                      <span key={sIdx} className={`font-black text-xs bg-slate-50 px-2 py-0.5 rounded border border-gray-100 flex items-center gap-1 ${colorClass}`}>
                        {star.name}
                        {star.brightness && <span className="text-[9px] text-slate-400">({star.brightness})</span>}
                        {star.mutagen && (
                          <span className={`text-[7px] px-1 rounded border font-black uppercase ${MUTAGEN_STYLES[star.mutagen]}`}>
                            {MUTAGEN_LABELS[star.mutagen]}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Minor Stars */}
              {(leftStars.length > 0 || rightStars.length > 0) && (
                <div className="flex flex-col gap-1.5 border-t border-purple-50/30 pt-2">
                  {leftStars.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-emerald-600">Cát tinh:</span>
                      {leftStars.map((star, sIdx) => (
                        <span key={sIdx} className={`text-xs font-semibold ${ELEMENT_COLORS[STAR_ELEMENTS[star.name] || 'Thủy']}`}>
                          {star.name}{star.brightness ? `(${star.brightness})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {rightStars.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-rose-600">Sát/Bại tinh:</span>
                      {rightStars.map((star, sIdx) => (
                        <span key={sIdx} className={`text-xs font-semibold ${ELEMENT_COLORS[STAR_ELEMENTS[star.name] || 'Thủy']}`}>
                          {star.name}{star.brightness ? `(${star.brightness})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer: Changsheng, Tieu Han, Nguyet Han */}
            <div className="flex justify-between items-center border-t border-purple-50/50 pt-2 text-[10px] text-slate-500 font-semibold mt-1">
              <span>Trường sinh: <strong className="text-slate-700">{palace.changsheng12 === "Mục Dục" ? "Mộc Dục" : palace.changsheng12}</strong></span>
              <div className="flex gap-3">
                <span>Tiểu hạn: <strong className="text-indigo-600">{BRANCHES[(BRANCHES.indexOf(palace.earthlyBranch) - 2 + 12) % 12]}</strong></span>
                <span>Nguyệt hạn: <strong className="text-purple-650">Th.{((BRANCHES.indexOf(palace.earthlyBranch) - (new Date().getFullYear() - 4) % 12 + 12) % 12 + 1)}</strong></span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TuViChart = ({ chartData }) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  if (!chartData || !chartData.palaces) {
    return (
      <div className="p-12 text-center text-slate-400">
        Không có dữ liệu lập lá số Tử Vi.
      </div>
    );
  }

  const palaces = chartData.palaces;
  const elementHighlight = getElementHighlight(chartData.fiveElementsClass);

  return (
    <div className="w-full max-w-5xl mx-auto p-2 md:p-6 bg-gradient-to-tr from-purple-50/10 to-indigo-50/10 border border-purple-100 rounded-3xl backdrop-blur-sm shadow-xl shadow-purple-950/2 md:p-8">
      
      {/* View Mode Toggle Switch - Visible on Mobile/Tablet ONLY */}
      <div className="flex md:hidden justify-center bg-purple-100/50 p-1 rounded-xl border border-purple-200/50 mb-4 max-w-xs mx-auto">
        <button 
          onClick={() => setViewMode('grid')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
            viewMode === 'grid' 
              ? 'bg-purple-600 text-white shadow-sm' 
              : 'text-purple-700 hover:bg-purple-100'
          }`}
        >
          Mệnh Bàn (4x4)
        </button>
        <button 
          onClick={() => setViewMode('list')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
            viewMode === 'list' 
              ? 'bg-purple-600 text-white shadow-sm' 
              : 'text-purple-700 hover:bg-purple-100'
          }`}
        >
          Danh Sách Cung
        </button>
      </div>

      {viewMode === 'grid' ? (
        <>
          {/* Swipe indicator for mobile */}
          <div className="block md:hidden text-center text-[10px] text-purple-600 font-bold mb-2.5 animate-pulse select-none">
            ← Vuốt ngang để xem đầy đủ mệnh bàn 12 cung →
          </div>

          {/* Scrollable grid wrapper for mobile */}
          <div className="w-full overflow-x-auto hide-scrollbar p-2 md:p-3">
            {/* 4x4 Responsive Grid Astrolabe Chart - Lock grid-cols-4 for mobile view */}
            <div className="grid grid-cols-4 gap-1 md:gap-3.5 relative overflow-visible min-w-[750px] md:min-w-0 w-full select-none">
              
              {/* Render 12 Cung dynamically inside custom grid position */}
              {palaces.map((palace, idx) => (
                <PalaceCell key={palace.index || idx} palace={palace} elementHighlight={elementHighlight} />
              ))}

              {/* TRUNG CUNG - Center span (merged middle cells: Row 2-3, Col 2-3) */}
              <div 
                className="col-span-2 row-span-2 p-1.5 md:p-6 flex flex-col justify-between bg-white/80 backdrop-blur-xl border border-purple-200/80 rounded-2xl md:rounded-3xl shadow-xl shadow-purple-950/5 relative overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-500 aspect-square select-none"
                style={{ gridRow: "span 2", gridColumn: "span 2" }}
              >
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-12 h-12 md:w-24 md:h-24 bg-purple-100/40 opacity-40 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 md:w-24 md:h-24 bg-indigo-100/40 opacity-40 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                {/* Center Box Content */}
                <div className="relative z-10 flex flex-col h-full justify-between gap-1 md:gap-6">
                  
                  {/* Top Row - Title and Identity */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5 md:gap-3">
                      <div className="p-1 md:p-3 bg-purple-500 text-white rounded-xl md:rounded-2xl shadow-lg shadow-purple-500/30 shrink-0">
                        <Sparkles size={14} className="md:w-[22px] md:h-[22px]" />
                      </div>
                      <div>
                        <h2 className="font-extrabold text-slate-800 text-[9px] md:text-xl tracking-tight leading-tight">
                          Trung Cung
                        </h2>
                        <p className="text-[6.5px] md:text-[11px] text-purple-600 font-bold uppercase tracking-wider mt-0.5">
                          TỬ VI BẮC PHÁI
                        </p>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 md:px-3 md:py-1 rounded-full text-[7px] md:text-xs font-black uppercase tracking-wider ${
                      chartData.gender === 'Nam' 
                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {chartData.gender} Mệnh
                    </span>
                  </div>

                  {/* Middle Row - Astrological Info Stats */}
                  <div className="grid grid-cols-2 gap-1 md:gap-3 bg-purple-50/20 p-1 md:p-4 rounded-xl md:rounded-2xl border border-purple-100/30 text-[7px] md:text-sm">
                    <div className="flex flex-col">
                      <span className="text-[6px] md:text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-0.5">Bản Mệnh Cục</span>
                      <span className="font-extrabold text-slate-900 leading-none">{chartData.fiveElementsClass || "Kim Tứ Cục"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[6px] md:text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-0.5">Mệnh / Thân Chủ</span>
                      <span className="font-extrabold text-slate-900 leading-none">{chartData.soul || "Liêm Trinh"} / {chartData.body || "Thiên Lương"}</span>
                    </div>
                    <div className="flex flex-col col-span-2 border-t border-purple-100/30 pt-1 md:pt-2 mt-0.5 md:mt-1">
                      <span className="text-[6px] md:text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-0.5">Tứ Trụ Can Chi</span>
                      <span className="font-extrabold text-[6.5px] md:text-xs text-purple-900 leading-tight">
                        {chartData.chineseDate || "Ất Hợi - Bính Tuất - Kỷ Mão - Kỷ Tỵ"}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row - Date & Time Calendars */}
                  <div className="flex items-center gap-1.5 md:gap-3 text-slate-500 text-[7px] md:text-xs">
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <span className="font-bold text-slate-800">{chartData.solarDate || "Chưa xác định"}</span>
                    </div>
                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <span className="font-bold text-slate-800">{chartData.zodiac || "Chưa xác định"}</span>
                    </div>
                  </div>
                  
                </div>
              </div>

            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4 w-full animate-in fade-in duration-300">
          {/* Mobile list view header info */}
          <div className="p-4 bg-white/90 border border-purple-200/80 rounded-2xl shadow-md flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100/40 opacity-30 rounded-full blur-xl"></div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500 text-white rounded-lg">
                  <Sparkles size={14} />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">Thông Tin Bản Mệnh</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                chartData.gender === 'Nam' 
                  ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                  : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
                {chartData.gender} Mệnh
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-purple-50/20 p-3 rounded-xl border border-purple-100/20">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Bản Mệnh Cục</span>
                <span className="font-extrabold text-slate-900">{chartData.fiveElementsClass || "Kim Tứ Cục"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Mệnh / Thân Chủ</span>
                <span className="font-extrabold text-slate-900">{chartData.soul || "Liêm Trinh"} / {chartData.body || "Thiên Lương"}</span>
              </div>
              <div className="flex flex-col col-span-2 border-t border-purple-100/20 pt-2 mt-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tứ Trụ Can Chi</span>
                <span className="font-extrabold text-purple-900 leading-tight">
                  {chartData.chineseDate || "Ất Hợi - Bính Tuất - Kỷ Mão - Kỷ Tỵ"}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-slate-500 text-[11px] font-semibold pt-1">
              <span>Dương lịch: <strong>{chartData.solarDate}</strong></span>
              <span>Giờ: <strong>{chartData.zodiac}</strong></span>
            </div>
          </div>

          <PalaceListView palaces={palaces} elementHighlight={elementHighlight} />
        </div>
      )}

      {/* Chú giải Ngũ hành & Đắc Hãm ở cuối lá số */}
      <div className="mt-4 p-3 bg-amber-50/20 border border-purple-200/40 rounded-2xl text-[9px] md:text-[11.5px] font-semibold text-slate-600 flex flex-col md:flex-row justify-between items-center gap-2 select-none leading-relaxed">
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-center">
          <span><span className="font-extrabold text-purple-900 font-sans">(M)</span>: Miếu địa</span>
          <span><span className="font-extrabold text-purple-900 font-sans">(V)</span>: Vượng địa</span>
          <span><span className="font-extrabold text-purple-900 font-sans">(Đ)</span>: Đắc địa</span>
          <span><span className="font-extrabold text-purple-900 font-sans">(B)</span>: Bình hòa</span>
          <span><span className="font-extrabold text-purple-900 font-sans">(H)</span>: Hãm địa</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center items-center font-bold">
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-slate-400 border border-slate-300"></div>
            <span>Kim</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-emerald-700 border border-emerald-600"></div>
            <span>Mộc</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-neutral-900 border border-neutral-800"></div>
            <span>Thủy</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-500"></div>
            <span>Hỏa</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-amber-600 border border-amber-500"></div>
            <span>Thổ</span>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default TuViChart;

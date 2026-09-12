import React, { useState } from 'react';
import { Sparkles, Check, Zap, BookOpen, Crown, X } from 'lucide-react';

const SYSTEM_TIER_INFO = {
  bazi: {
    systemName: 'Bát Tự Hà Lạc',
    upgradeTitle: 'Bản Chuyên Sâu 6 Chương Học Thuật',
    upgradeDescription: 'Hệ thống sẽ tái lập và nâng cấp bản luận giải thành công trình nghiên cứu toàn diện 5.000+ từ qua 6 Chuyên đề học thuật: Sự Nghiệp, Tài Chính, Hôn Nhân, Sức Khỏe Đông Y, Phong Thủy Cải Vận và Lộ Trình Đại Vận 100 Năm.',
    upgradeBullets: [
      'Phân tích đa chiều từng điểm gãy vận hạn, cơ hội bứt phá và chu kỳ biến cố lớn',
      'Bảng dự báo Lưu Niên chi tiết, định vị rõ thời điểm nên tiến thủ hay thu mình phòng thủ',
      'Bộ giải pháp Phong Thủy cá nhân hóa và Dụng Thần điều hòa năng lượng bản mệnh'
    ],
    standard: {
      title: 'Luận Giải Cơ Bản',
      badge: '1 Credit',
      description: 'Bản phân tích cô đọng, nhanh chóng nắm bắt bức tranh tổng quan về nguyên cục và cát hung cốt lõi.',
      bullets: [
        'Khảo sát nguyên cục: Can Chi, Ngũ Hành, Thần Sát cốt lõi',
        'Đánh giá Thân Vượng / Thân Nhược và Dụng Thần sơ khởi',
        'Luận giải cô đọng các phương diện đời người (800 - 1.200 từ)',
        'Định hướng ứng xử và chiến lược tổng quan năm hiện tại'
      ]
    },
    vip: {
      title: 'Luận Giải Chuyên Sâu',
      badge: '5 Credits',
      description: 'Công trình học thuật toàn diện 5.000+ từ phân tích sâu sắc cả cuộc đời qua 6 Chuyên đề chuyên biệt.',
      bullets: [
        { bold: '6 Chuyên Đề Luận Giải:', text: ' Sự Nghiệp, Tài Vận, Hôn Nhân, Sức Khỏe, Cải Vận, Đại Vận 100 Năm' },
        { bold: 'Khảo cứu sâu sắc 5.000+ từ:', text: ' Giải mã từng điểm gãy vận hạn, chu kỳ biến cố và thời cơ bứt phá' },
        { bold: 'Bảng Diễn Biến Đại Vận & Lưu Niên:', text: ' Lộ trình chiến lược năm nào nên tiến công, năm nào cần phòng thủ' },
        { bold: 'Bộ Giải Pháp Phong Thủy Cải Vận:', text: ' Phương vị, màu sắc, dưỡng sinh tạng phủ và Dụng Thần điều hòa' }
      ]
    }
  },
  ziwei: {
    systemName: 'Tử Vi Đẩu Số',
    upgradeTitle: 'Bản Chuyên Sâu 5 Chương Toàn Đồ',
    upgradeDescription: 'Hệ thống kích hoạt tổ hợp Multi-Agent khai phá 5 Chương Toàn Đồ, kết hợp giám định Cốt cách Mệnh Thân & Cục, truy vết Tứ Hóa Phi Tinh, Ma Trận Mệnh Bàn SWOT và Lộ Trình Đại Hạn 10 Năm.',
    upgradeBullets: [
      'Truy vết dòng chảy Tứ Hóa Phi Tinh (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ) tương tác với 12 cung số',
      'Ma Trận Mệnh Bàn SWOT 4 chiều định vị thế mạnh, tử huyệt, thời cơ và cạm bẫy cuộc đời',
      'Kế sách Phi Tinh Hóa Giải Tinh Đồ và bảng dự phóng Đại Hạn 10 Năm chi tiết'
    ],
    standard: {
      title: 'Luận Giải Cơ Bản 12 Cung',
      badge: '1 Credit',
      description: 'Phân tích tổng quan 12 cung số, vị trí các chính tinh đắc hãm và cát hung cơ bản của bản mệnh.',
      bullets: [
        'Khảo sát 12 Cung Số: Mệnh, Thân, Tài Bạch, Quan Lộc, Phu Thê...',
        'Đánh giá chính diệu đắc hãm và cách cục nổi bật tại Mệnh Bàn',
        'Tổng luận cát hung, điểm mạnh cốt lõi và bài học thực tế (1.200 - 1.800 từ)',
        'Dự báo xu hướng tổng quan năm hiện tại'
      ]
    },
    vip: {
      title: 'Luận Giải Chuyên Sâu',
      badge: '5 Credits',
      description: 'Công trình học thuật uyên thâm 5.000+ từ kết hợp Tứ Hóa Phi Tinh, Ma Trận Mệnh Bàn SWOT và Lộ Trình Đại Hạn 10 Năm.',
      bullets: [
        { bold: '5 Chương Chuyên Sâu:', text: ' Mệnh Thân Phúc, Quan Tài Điền, Phu Tử, Tật Di, Nô Phụ Huynh' },
        { bold: 'Biện Chứng Tứ Hóa Phi Tinh:', text: ' Truy vết dòng chảy Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ' },
        { bold: 'Ma Trận Mệnh Bàn SWOT:', text: ' Định vị 4 chiều Thế Mạnh, Tử Huyệt, Thời Cơ, Cạm Bẫy' },
        { bold: 'Kế Sách Phi Tinh Hóa Giải:', text: ' Điều hòa năng lượng hung sát tinh & Lộ trình Đại Hạn 10 Năm' }
      ]
    }
  },
  marriage: {
    systemName: 'Hợp Hôn Tiền Định',
    upgradeTitle: 'Bản So Hợp Toàn Diện 4 Chương',
    upgradeDescription: 'Hệ thống đối soát toàn diện 4 Chương Hôn Nhân: Tâm lý hai bản thể, Quản trị tài chính gia đình, Phương pháp hóa giải xung khắc phòng cưới và Bản đồ đồng hành trăm năm.',
    upgradeBullets: [
      'Nghiên cứu đối chiếu Tứ Trụ chuyên sâu: Can Chi 4 trụ, Cung Phối Ngẫu và Lục Hợp, Tam Hợp, Lục Xung',
      'Pháp hóa giải xung khắc cụ thể: Phương vị phòng cưới, màu sắc và vật phẩm trợ duyên hòa hợp',
      'Bản đồ đồng hành trăm năm: Định vị các năm nhạy cảm cần nhường nhịn và chu kỳ thịnh vượng gia đạo'
    ],
    standard: {
      title: 'So Hợp Cơ Bản',
      badge: '1 Credit',
      description: 'Khảo sát tương hợp Can Chi, Ngũ Hành nạp âm và độ hòa hợp sơ khởi giữa hai đương số.',
      bullets: [
        'Đối soát Cung Phi Bát Trạch & Du Niên Bát Quái',
        'Đánh giá tương sinh tương khắc Ngũ Hành Nạp Âm bản mệnh',
        'Bình giải tổng quan mức độ hòa hợp lứa đôi (800 - 1.200 từ)',
        'Lời khuyên ứng xử nền tảng cho hai vợ chồng'
      ]
    },
    vip: {
      title: 'So Hợp Chuyên Sâu',
      badge: '5 Credits',
      description: 'Nghiên cứu đối chiếu Tứ Trụ chuyên sâu 5.000+ từ, giải mã 4 chương hôn nhân và pháp hóa giải xung khắc triệt để.',
      bullets: [
        { bold: '4 Chương Gia Đạo:', text: ' Cốt cách tâm lý, Tài chính chung, Con cái và Vận trình trăm năm' },
        { bold: 'Đối Soát Tứ Trụ Chuyên Sâu:', text: ' Can Chi 4 trụ, Cung Phối Ngẫu và Lục Hợp, Tam Hợp, Lục Xung' },
        { bold: 'Pháp Hóa Giải Xung Khắc:', text: ' Phương vị phòng cưới, màu sắc và vật phẩm điều hòa năng lượng' },
        { bold: 'Bản Đồ Đồng Hành Trăm Năm:', text: ' Thời điểm nhạy cảm cần giữ gìn và năm hoàng kim gia đạo' }
      ]
    }
  },
  iching: {
    systemName: 'Kinh Dịch Diệu Quẻ',
    upgradeTitle: 'Bản Luận Giải 6 Chương Tượng Pháp & Lục Hào',
    upgradeDescription: 'Hệ thống kết hợp biện chứng giữa Tượng Pháp 64 Quẻ và Lục Hào Dụng Thần, đối chiếu Biểu - Lý khách quan và định lượng Ứng Kỳ theo ngữ cảnh câu hỏi.',
    upgradeBullets: [
      'Tượng Pháp Chu Dịch & Biện chứng Lục Hào Dụng Thần chuyên sâu (Thần Sát, Tuần Không, Phục Thần)',
      'Đối chiếu Biểu vs Lý: Giải mã Quẻ Hung Hào Cát (vượt khó hái quả ngọt) vs Quẻ Cát Hào Hung (mật ngọt chết ruồi)',
      'Mốc Thời Gian Ứng Kỳ Cát Hung: Định vị theo ngữ cảnh (mốc ấn định, tìm đồ mất, kỳ vọng tương lai)'
    ],
    standard: {
      title: 'Luận Quẻ Cơ Bản',
      badge: '1 Credit',
      description: 'Luận giải Thoán từ, Hào từ và phân tích Động Hào trả lời trực diện cho câu hỏi thắc mắc.',
      bullets: [
        'Xác lập Quẻ Chủ, Quẻ Biến và Hào Động mấu chốt',
        'Biện chứng Thế - Ứng và trạng thái tương tác Lục Thân',
        'Lời khuyên hành động tức thời cho sự việc đang hỏi (800 - 1.200 từ)',
        'Đánh giá Cát Hung tổng quan theo Kinh Dịch cổ điển'
      ]
    },
    vip: {
      title: 'Luận Quẻ Chuyên Sâu',
      badge: '5 Credits',
      description: 'Công trình Dịch học 6 Chương toàn diện 5.000+ từ, đối chiếu Tượng - Hào khách quan và định vị Ứng Kỳ chuẩn xác.',
      bullets: [
        { bold: 'Tượng Pháp & Lục Hào Biện Chứng:', text: ' Khảo cứu bối cảnh thế cuộc và thực lực Dụng Thần vượng suy' },
        { bold: 'Đối Chiếu Biểu vs Lý Khách Quan:', text: ' Phán quyết dứt khoát, không thiên vị hay võ đoán' },
        { bold: 'Thời Khắc Ứng Kỳ Theo Ngữ Cảnh:', text: ' Xử lý chính xác sự kiện ngắn hạn, đồ vật thất lạc hoặc kỳ vọng' },
        { bold: 'Kim Chỉ Nam Đạo Dịch Thực Chiến:', text: ' Phác đồ hành động từng bước tùy thời biến dịch' }
      ]
    }
  }
};

const InterpretationTierModal = ({
  isOpen,
  onClose,
  onConfirm,
  userCredits = 0,
  isUpgrade = false,
  system = 'bazi'
}) => {
  const [selectedTier, setSelectedTier] = useState('vip');

  if (!isOpen) return null;

  const currentInfo = SYSTEM_TIER_INFO[system] || SYSTEM_TIER_INFO.bazi;

  // Trường hợp 1: Nâng cấp từ bài Thường lên bài Chuyên Sâu (Modal xác nhận nhanh 4 Credits)
  if (isUpgrade) {
    const cost = 4;
    const canAfford = userCredits >= cost;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative text-slate-900">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
              <Crown className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Nâng Cấp Luận Giải Chuyên Sâu</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phân hệ: <span className="font-semibold text-slate-700">{currentInfo.systemName}</span> | Số dư: <span className="font-semibold text-amber-600">{userCredits} Credits</span>
              </p>
            </div>
          </div>

          <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 sm:p-5 mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-bold text-amber-950">{currentInfo.upgradeTitle}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                Chi phí: 4 Credits
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3.5">
              {currentInfo.upgradeDescription}
            </p>
            <ul className="text-xs text-slate-700 space-y-2">
              {currentInfo.upgradeBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-200/70 transition-all duration-150 shadow-2xs"
            >
              Hủy Bỏ
            </button>
            <button
              onClick={() => onConfirm('vip')}
              disabled={!canAfford}
              className={`flex-1 py-3 px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden ${
                canAfford
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] border border-amber-400/30 ring-1 ring-white/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 fill-current text-amber-100" />
              </div>
              <span className="tracking-wide">{canAfford ? 'Xác Nhận Nâng Cấp (4 Cr)' : 'Không Đủ Credits'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trường hợp 2: Khi chưa có luận giải nào -> Hiển thị Modal 2 cột chọn gói
  const canAffordStandard = userCredits >= 1;
  const canAffordVip = userCredits >= 5;
  const isSelectedVip = selectedTier === 'vip';
  const selectedCost = isSelectedVip ? 5 : 1;
  const canAffordSelected = isSelectedVip ? canAffordVip : canAffordStandard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 max-w-3xl w-full shadow-2xl relative text-slate-900 max-h-[96vh] flex flex-col justify-between">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900">
            Chọn Gói Luận Giải {currentInfo.systemName}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Số dư hiện tại của bạn: <span className="font-bold text-amber-600">{userCredits} Credits</span>
          </p>
        </div>

        {/* Khung 2 Cột: Co dãn hoàn hảo */}
        <div className="overflow-y-auto flex-1 min-h-0 pr-1 -mr-1 mb-3 sm:mb-4 pt-3.5 pb-1 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Cột Trái: Luận Giải Cơ Bản */}
            <div
              onClick={() => setSelectedTier('standard')}
              className={`cursor-pointer rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition relative border-2 ${
                !isSelectedVip
                  ? 'bg-slate-50 border-slate-800 shadow-md ring-2 ring-slate-800/10'
                  : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition ${
                      !isSelectedVip ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {!isSelectedVip && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />}
                    </div>
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">{currentInfo.standard.title}</h4>
                  </div>
                  <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                    {currentInfo.standard.badge}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mb-2.5">
                  {currentInfo.standard.description}
                </p>
                <ul className="text-[11px] sm:text-xs text-slate-700 space-y-1.5 sm:space-y-2">
                  {currentInfo.standard.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`mt-3 py-1.5 px-3 rounded-xl text-center text-[11px] sm:text-xs font-semibold transition ${
                !isSelectedVip ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {!isSelectedVip ? '✓ Đang chọn gói này' : 'Nhấp để chọn'}
              </div>
            </div>

            {/* Cột Phải: Luận Giải Chuyên Sâu */}
            <div
              onClick={() => setSelectedTier('vip')}
              className={`cursor-pointer rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition relative border-2 ${
                isSelectedVip
                  ? 'bg-amber-50/40 border-amber-500 shadow-md ring-2 ring-amber-500/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Badge Khuyên Dùng */}
              <div className="absolute -top-3 right-3.5 sm:right-5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white text-[10px] font-extrabold shadow-md shadow-amber-500/30 ring-2 ring-white uppercase tracking-wider flex items-center gap-1 z-10">
                <Sparkles className="w-3 h-3 fill-current text-amber-100" />
                <span>Khuyên Dùng</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition ${
                      isSelectedVip ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelectedVip && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />}
                    </div>
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">{currentInfo.vip.title}</h4>
                  </div>
                  <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    {currentInfo.vip.badge}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mb-2.5">
                  {currentInfo.vip.description}
                </p>
                <ul className="text-[11px] sm:text-xs text-slate-700 space-y-1.5 sm:space-y-2">
                  {currentInfo.vip.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>{bullet.bold}</strong>{bullet.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`mt-3 py-1.5 px-3 rounded-xl text-center text-[11px] sm:text-xs font-semibold transition ${
                isSelectedVip ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50 text-amber-700'
              }`}>
                {isSelectedVip ? '✓ Đang chọn gói này' : 'Nhấp để chọn'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <p className="text-[10px] sm:text-xs text-slate-500 text-center sm:text-left">
            * Bạn có thể chọn bản cơ bản trước và nâng cấp lên chuyên sâu bất cứ lúc nào (chỉ bù 4 credits chênh lệch).
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-200/70 transition-all duration-150 shadow-2xs"
            >
              Hủy Bỏ
            </button>
            <button
              onClick={() => onConfirm(selectedTier)}
              disabled={!canAffordSelected}
              className={`flex-1 sm:flex-initial py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2.5 relative overflow-hidden ${
                canAffordSelected
                  ? isSelectedVip
                    ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] border border-amber-400/30 ring-1 ring-white/20'
                    : 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white shadow-lg shadow-slate-900/20 active:scale-[0.98] border border-slate-700/40'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${isSelectedVip ? 'bg-white/20' : 'bg-white/10'}`}>
                {isSelectedVip ? <Zap className="w-3.5 h-3.5 fill-current text-amber-100" /> : <BookOpen className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="tracking-wide">
                {canAffordSelected
                  ? `Xác Nhận Luận Giải (${selectedCost} Credit${selectedCost > 1 ? 's' : ''})`
                  : `Không Đủ Credits (Cần ${selectedCost})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterpretationTierModal;

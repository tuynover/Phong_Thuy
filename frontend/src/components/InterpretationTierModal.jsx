import React, { useState } from 'react';
import { Sparkles, Check, Zap, BookOpen, Crown, X } from 'lucide-react';

const InterpretationTierModal = ({ isOpen, onClose, onConfirm, userCredits = 0, isUpgrade = false }) => {
  const [selectedTier, setSelectedTier] = useState('vip'); // Mặc định chọn Chuyên Sâu

  if (!isOpen) return null;

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
                Số dư hiện tại: <span className="font-semibold text-amber-600">{userCredits} Credits</span>
              </p>
            </div>
          </div>

          <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 sm:p-5 mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-bold text-amber-950">Bản Chuyên Sâu 6 Chương Học Thuật</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                Chi phí: 4 Credits
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3.5">
              Hệ thống sẽ tái lập và nâng cấp bản luận giải thành công trình nghiên cứu toàn diện 5.000+ từ qua 6 Chuyên đề học thuật: Sự Nghiệp, Tài Chính, Hôn Nhân, Sức Khỏe Đông Y, Phong Thủy Cải Vận và Lộ Trình Đại Vận 100 Năm.
            </p>
            <ul className="text-xs text-slate-700 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Phân tích đa chiều từng điểm gãy vận hạn, cơ hội bứt phá và chu kỳ biến cố lớn</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bảng dự báo Lưu Niên chi tiết, định vị rõ thời điểm nên tiến thủ hay thu mình phòng thủ</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bộ giải pháp Phong Thủy cá nhân hóa và Dụng Thần điều hòa năng lượng bản mệnh</span>
              </li>
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

  // Trường hợp 2: Khi chưa có luận giải nào -> Hiển thị Modal 2 cột gói gọn trong 1 khung hình không cuộn
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

        {/* Header rút gọn chiều cao */}
        <div className="text-center mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900">Chọn Gói Luận Giải Học Thuật</h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Số dư hiện tại của bạn: <span className="font-bold text-amber-600">{userCredits} Credits</span>
          </p>
        </div>

        {/* Khung 2 Cột: Co dãn hoàn hảo, tự động cuộn nội bộ khi màn hình quá nhỏ */}
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
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">Luận Giải Cơ Bản</h4>
                  </div>
                  <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                    1 Credit
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mb-2.5">
                  Bản phân tích cô đọng, nhanh chóng nắm bắt bức tranh tổng quan về nguyên cục và cát hung cốt lõi.
                </p>
                <ul className="text-[11px] sm:text-xs text-slate-700 space-y-1.5 sm:space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Khảo sát nguyên cục: Can Chi, Ngũ Hành, Thần Sát cốt lõi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Đánh giá Thân Vượng / Thân Nhược và Dụng Thần sơ khởi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Luận giải cô đọng các phương diện đời người (800 - 1.200 từ)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Định hướng ứng xử và chiến lược tổng quan năm hiện tại</span>
                  </li>
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
              {/* Badge Khuyên Dùng: Nổi bật, có shadow và ring-2 không bao giờ bị cắt */}
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
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">Luận Giải Chuyên Sâu</h4>
                  </div>
                  <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    5 Credits
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mb-2.5">
                  Công trình học thuật toàn diện 5.000+ từ phân tích sâu sắc cả cuộc đời qua 6 Chuyên đề chuyên biệt.
                </p>
                <ul className="text-[11px] sm:text-xs text-slate-700 space-y-1.5 sm:space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span><strong>6 Chuyên Đề Luận Giải:</strong> Sự Nghiệp, Tài Vận, Hôn Nhân, Sức Khỏe, Cải Vận, Đại Vận 100 Năm</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span><strong>Khảo cứu sâu sắc 5.000+ từ:</strong> Giải mã từng điểm gãy vận hạn, chu kỳ biến cố và thời cơ bứt phá</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span><strong>Bảng Diễn Biến Đại Vận & Lưu Niên:</strong> Lộ trình chiến lược năm nào nên tiến công, năm nào cần phòng thủ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span><strong>Bộ Giải Pháp Phong Thủy Cải Vận:</strong> Phương vị, màu sắc, dưỡng sinh tạng phủ và Dụng Thần điều hòa</span>
                  </li>
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

        {/* Thanh Điều Hướng & Nút Xác Nhận Chung */}
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


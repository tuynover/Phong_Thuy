import React from 'react';
import { X, Clock, HelpCircle, CheckCircle2, Sparkles, Compass } from 'lucide-react';
import { CANH_GIO_LIST } from '@/utils/canhGioHelper';

export default function CanhGioGuideModal({ isOpen, onClose, selectedHour }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Clock className="text-amber-300 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-serif tracking-wide">Hướng Dẫn & Giải Đáp Giờ Sinh</h3>
              <p className="text-[11px] text-blue-200 font-medium">Bát Tự & Tử Vi theo 12 Canh Giờ Cổ Học</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* Main reassuring message */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl border border-amber-200/80 shadow-sm">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-amber-950 text-sm">Vì sao không cần chính xác từng phút sinh?</h4>
                <p className="text-amber-900/90 text-xs leading-relaxed">
                  Trong thuật số Đông Phương (Bát Tự và Tử Vi), một ngày được chia thành <strong>12 Canh Giờ Địa Chi</strong>, mỗi canh tương ứng với <strong>2 tiếng đồng hồ</strong>.
                </p>
                <p className="text-amber-900/90 text-xs leading-relaxed">
                  Lá số được an theo <strong>Địa Chi của Canh Giờ</strong> chứ không tính theo từng phút. Miễn là giờ sinh của bạn cùng nằm trong một canh giờ (ví dụ: sinh lúc 07:15, 07:30 hay 08:45 đều thuộc chung <strong>Giờ Thìn</strong>) thì lá số được an <strong>hoàn toàn giống nhau 100%</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Quick advice */}
          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-blue-900 text-xs">
              <strong>Lời khuyên:</strong> Nếu bạn chỉ nhớ sinh khoảng <em>sáng sớm (7-8h)</em>, <em>buổi trưa (11-12h)</em> hay <em>xế chiều</em>, chỉ cần chọn mốc giờ đó và để phút tùy ý (ví dụ: <code>00</code> hoặc <code>30</code>), kết quả lá số hoàn toàn chuẩn xác.
            </p>
          </div>

          {/* Reference Table for 12 Canh Gio */}
          <div>
            <h4 className="font-extrabold text-slate-800 mb-2.5 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Compass size={14} className="text-indigo-600" /> Bảng Tra Cứu 12 Canh Giờ Trong Ngày
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CANH_GIO_LIST.map((item) => {
                const isSelected = selectedHour !== undefined && selectedHour !== '' && (
                  (parseInt(selectedHour, 10) === 23 || parseInt(selectedHour, 10) === 0) 
                    ? item.chi === 'Tý' 
                    : (parseInt(selectedHour, 10) >= item.hourStart && parseInt(selectedHour, 10) <= item.hourEnd)
                );

                return (
                  <div 
                    key={item.chi}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                      isSelected 
                        ? 'bg-indigo-50/90 border-indigo-300 font-bold text-indigo-900 shadow-sm ring-1 ring-indigo-300' 
                        : 'bg-slate-50 border-slate-200/70 text-slate-600'
                    }`}
                  >
                    <div>
                      <span className="font-black text-slate-900 mr-1.5">Giờ {item.chi}</span>
                      <span className="text-[11px] text-slate-500 font-mono">({item.range})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{item.desc.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow transition-all cursor-pointer"
          >
            Đã Hiểu & Tiếp Tục
          </button>
        </div>
      </div>
    </div>
  );
}

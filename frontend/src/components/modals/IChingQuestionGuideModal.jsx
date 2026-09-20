import React, { useState } from 'react';
import { X, Sparkles, HelpCircle, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare, Briefcase, Heart, Coins, Home, Activity } from 'lucide-react';

const QUESTION_CATEGORIES = [
  {
    id: 'career',
    name: 'Công Danh & Sự Nghiệp',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    questions: [
      'Công việc hiện tại trong 3 đến 6 tháng tới có cơ hội thăng tiến hay tăng lương không?',
      'Tôi có nên chuyển sang công ty mới vào thời điểm này hay nên kiên nhẫn ở lại?',
      'Dự án mới chuẩn bị triển khai sắp tới có gặp trở ngại gì lớn không?',
      'Kỳ thi tuyển dụng / phỏng vấn sắp tới của tôi có kết quả thuận lợi không?'
    ]
  },
  {
    id: 'wealth',
    name: 'Tài Chính & Kinh Doanh',
    icon: Coins,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    questions: [
      'Khoản đầu tư / dự án kinh doanh sắp tới có sinh lời an toàn không?',
      'Tôi có nên góp vốn hợp tác làm ăn với đối tác này vào thời điểm hiện tại không?',
      'Giao dịch mua bán bất động sản / tài sản lớn sắp tới có trôi chảy không?',
      'Khoản tiền nợ khó đòi này trong năm nay có cơ hội thu hồi được không?'
    ]
  },
  {
    id: 'love',
    name: 'Tình Duyên & Gia Đạo',
    icon: Heart,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    questions: [
      'Mối quan hệ của chúng tôi sắp tới có vượt qua được giai đoạn mâu thuẫn này không?',
      'Người tôi đang tìm hiểu có phù hợp để tiến tới hôn nhân bền vững lâu dài không?',
      'Chuyện tình cảm sắp tới nên chủ động bày tỏ hay giữ khoảng cách quan sát?',
      'Gia đạo người thân sắp tới có chuyện gì cần lưu ý để giữ hòa khí không?'
    ]
  },
  {
    id: 'estate',
    name: 'Nhà Đất & Xuất Hành',
    icon: Home,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    questions: [
      'Việc thay đổi chỗ ở / chuyển nhà trong thời gian tới có thuận lợi và an lành không?',
      'Chuyến đi công tác xa / xuất ngoại sắp tới có hanh thông bình an không?',
      'Khu đất / căn nhà tôi dự định mua có vượng khí và hợp phong thủy không?'
    ]
  },
  {
    id: 'health',
    name: 'Sức Khỏe & Bình An',
    icon: Activity,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    questions: [
      'Tình hình sức khỏe / điều trị bệnh sắp tới có chuyển biến tích cực không?',
      'Giai đoạn áp lực hiện tại cần làm gì để tâm trí an yên và phục hồi năng lượng?'
    ]
  }
];

export default function IChingQuestionGuideModal({ isOpen, onClose, onSelectQuestion }) {
  const [selectedCat, setSelectedCat] = useState('career');

  if (!isOpen) return null;

  const currentCategory = QUESTION_CATEGORIES.find(c => c.id === selectedCat) || QUESTION_CATEGORIES[0];

  const handlePickQuestion = (q) => {
    onSelectQuestion(q);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-amber-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-900 via-amber-800 to-orange-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="text-amber-300 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-serif tracking-wide">Hướng Dẫn Khởi Ý Niệm & Đặt Câu Hỏi</h3>
              <p className="text-[11px] text-amber-200 font-medium">Kinh Dịch Lục Hào & Mai Hoa Dịch Số</p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* 4 Core Principles */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/70 space-y-2.5">
            <h4 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-amber-700" /> 4 Nguyên Tắc Vàng Khi Khởi Ý Niệm Gieo Quẻ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-amber-900">
              <div className="p-2.5 bg-white rounded-xl border border-amber-100 shadow-2xs">
                <span className="font-bold block text-slate-900 mb-0.5">1. Tâm Tĩnh & Tập Trung:</span>
                Tĩnh tâm trong 10-15 giây, hình dung rõ ràng sự việc cần hỏi trước khi gieo.
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-amber-100 shadow-2xs">
                <span className="font-bold block text-slate-900 mb-0.5">2. Bất Nghi Bất Bặc:</span>
                Chỉ hỏi khi có điều băn khoăn thực sự, không hỏi thử quẻ, không đùa cợt.
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-amber-100 shadow-2xs">
                <span className="font-bold block text-slate-900 mb-0.5">3. Không Hỏi Hai Lần:</span>
                Cùng 1 việc không nên gieo quẻ nhiều lần trong ngày, tránh loạn tâm khí.
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-amber-100 shadow-2xs">
                <span className="font-bold block text-slate-900 mb-0.5">4. Sự Việc Cụ Thể:</span>
                Câu hỏi càng rõ ràng về thời gian và đối tượng thì quẻ giải đoán càng chuẩn xác.
              </div>
            </div>
          </div>

          {/* Question Formula */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-center justify-between gap-2">
            <span className="font-bold text-slate-600 shrink-0">Công thức chuẩn:</span>
            <code className="text-amber-900 font-extrabold bg-white px-2.5 py-1 rounded-lg border border-amber-200">
              [Thời điểm / Đối tượng] + [Sự việc cụ thể] + [Hướng phát triển / Kết quả mong muốn]
            </code>
          </div>

          {/* Quick Sample Prompts Library */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} className="text-amber-700" /> Thư Viện Câu Hỏi Mẫu (1 Chạm Điền Ngay)
              </h4>
              <span className="text-[11px] text-slate-400">Nhấn vào câu hỏi để tự động điền</span>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {QUESTION_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = selectedCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCat(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      active 
                        ? 'bg-amber-800 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon size={13} />
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Questions list for selected category */}
            <div className="space-y-2 mt-3">
              {currentCategory.questions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePickQuestion(q)}
                  className="w-full text-left p-3 rounded-xl bg-slate-50/70 hover:bg-amber-50/80 border border-slate-200/60 hover:border-amber-300 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <span className="text-xs font-medium text-slate-700 group-hover:text-amber-950">
                    "{q}"
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 group-hover:border-amber-300 flex items-center justify-center text-slate-400 group-hover:text-amber-800 shrink-0 transition-colors">
                    <ArrowRight size={13} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow transition-all cursor-pointer"
          >
            Đóng Hướng Dẫn
          </button>
        </div>
      </div>
    </div>
  );
}

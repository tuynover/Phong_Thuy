import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Compass, 
  Activity, 
  BarChart3, 
  Heart, 
  Calendar,
  CheckCircle2,
  Briefcase,
  HelpCircle,
  Lightbulb,
  Clock,
  UserCheck
} from 'lucide-react';

const MODULE_DEFINITIONS = {
  iching: {
    id: 'iching',
    title: 'Kinh Dịch Lục Hào',
    icon: Compass,
    color: 'from-amber-500 to-yellow-600',
    tag: 'Tư Vấn Sự Việc Trực Tiếp',
    badge: 'Phù Hợp 99%',
    description: 'Chuyên giải quyết các câu hỏi sự việc cụ thể, cấp bách: quyết định đổi việc, mua bán nhà đất, hợp tác làm ăn hay tình cảm trong tương lai gần.',
    whyChoose: [
      'Không đòi hỏi phải nhớ chính xác giờ hay ngày tháng năm sinh.',
      'Ứng dụng nguyên lý Âm Dương biến dịch giải đoán thẳng vào mấu chốt vấn đề.',
      'Cung cấp mốc thời gian Ứng Kỳ cụ thể (tháng nào, ngày nào sự việc diễn ra).'
    ],
    tip: 'Trước khi gieo quẻ, hãy nhắm mắt tĩnh tâm 30 giây và khởi niệm một câu hỏi cụ thể, rõ ràng nhất.'
  },
  bazi: {
    id: 'bazi',
    title: 'Tứ Trụ Bát Tự',
    icon: Activity,
    color: 'from-blue-600 to-indigo-600',
    tag: 'Bản Đồ Năng Lượng Cuộc Đời',
    badge: 'Phù Hợp 98%',
    description: 'Phân tích ngũ hành tương sinh tương khắc giữa 4 trụ Năm - Tháng - Ngày - Giờ sinh. Giúp xác định Dụng Thần cải mệnh, ngành nghề tương thích và vận hạn 100 năm.',
    whyChoose: [
      'Định lượng chính xác tỷ lệ phần trăm ngũ hành (Kim, Mộc, Thủy, Hỏa, Thổ).',
      'Chỉ dẫn phong thủy màu sắc, ngành nghề và phương hướng bổ cứu vận mệnh thực chiến.',
      'Dự đoán chu kỳ Đại Vận 10 năm và 3 bước ngoặt lớn nhất cuộc đời.'
    ],
    tip: 'Nếu không nhớ chính xác giờ sinh, Bát Tự vẫn phân tích 3 trụ Năm - Tháng - Ngày sinh rất sâu sắc.'
  },
  ziwei: {
    id: 'ziwei',
    title: 'Mệnh Số Tử Vi',
    icon: BarChart3,
    color: 'from-purple-600 to-violet-600',
    tag: 'Tinh Bàn 12 Cung Số Toàn Diện',
    badge: 'Phù Hợp 99%',
    description: 'Thiết lập bản đồ mệnh bàn 12 cung (Mệnh, Thân, Phụ Mẫu, Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc, Thiên Di, Tật Ách, Tài Bạch, Tử Tức, Phu Thê) với hơn 100 sao cát hung.',
    whyChoose: [
      'Bức tranh chi tiết toàn cảnh về 12 lĩnh vực trọng yếu của đời người.',
      'Soi chiếu tính cách, cốt cách nội tâm và tiềm năng tài hoa ẩn giấu.',
      'Dự báo hạn từng năm (Lưu niên) và kế sách phi tinh hóa giải hung khí.'
    ],
    tip: 'Cần có giờ sinh (hoặc nhớ khoảng canh giờ 2 tiếng) để an vị chính xác 12 cung mệnh bàn.'
  },
  marriage: {
    id: 'marriage',
    title: 'Bát Tự Hợp Hôn',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    tag: 'Hòa Hợp Lứa Đôi & Gia Đạo',
    badge: 'Phù Hợp 99%',
    description: 'Đối chiếu toàn diện bản mệnh của hai người: Cung phi, ngũ hành nạp âm, thập nhị địa chi và tương tác Dụng Thần để dự báo độ hòa hợp gia đạo.',
    whyChoose: [
      'Chấm điểm độ hòa hợp trên thang điểm 100 khách quan, khoa học.',
      'Chỉ rõ điểm gắn kết tương hợp và các tử huyệt xung khắc cần lưu ý.',
      'Phương pháp hóa giải xung khắc dựa trên ngũ hành con cái và phong thủy nhà ở.'
    ],
    tip: 'Chuẩn bị trước năm sinh hoặc ngày tháng năm sinh của cả bạn và đối phương.'
  },
  xemngay: {
    id: 'xemngay',
    title: 'Trạch Cát Xem Ngày',
    icon: Calendar,
    color: 'from-emerald-600 to-teal-600',
    tag: 'Khởi Sự Cát Lành Đúng Lúc',
    badge: 'Phù Hợp 99%',
    description: 'Tra cứu ngày lành, giờ hoàng đạo cho các sự kiện trọng đại: Khai trương, động thổ, cưới hỏi, xuất hành, ký hợp đồng kinh doanh.',
    whyChoose: [
      'Tích hợp Thập Nhị Kiến Tinh, Nhị Thập Bát Tú và Can Chi hoàng đạo.',
      'Lọc bỏ hoàn toàn các ngày xấu (Tam Nương, Nguyệt Kỵ, Sát Chủ...).',
      'Gợi ý khung giờ hoàng đạo vượng khí nhất trong ngày để khởi sự.'
    ],
    tip: 'Chọn trước khoảng thời gian bạn dự định tiến hành công việc để hệ thống quét ngày tối ưu nhất.'
  }
};

export default function DiscoveryQuizModal({ isOpen, onClose, onSelectModule }) {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [suggestedModule, setSuggestedModule] = useState(null);

  const handleGoalSelect = (goal) => {
    setSelectedGoal(goal);
    setStep(2);
  };

  const handleInfoSelect = (info) => {
    setSelectedInfo(info);
    
    // Logic suy luận môn phù hợp dựa trên Goal và Info
    let target = 'iching';

    if (selectedGoal === 'love') {
      target = 'marriage';
    } else if (selectedGoal === 'event_date') {
      target = 'xemngay';
    } else if (selectedGoal === 'urgent_action') {
      target = 'iching';
    } else if (selectedGoal === 'destiny_overview') {
      if (info === 'no_birthdate' || info === 'only_question') {
        target = 'iching';
      } else if (info === 'full_time') {
        target = 'bazi';
      } else {
        target = 'bazi';
      }
    } else if (selectedGoal === 'twelve_palaces') {
      if (info === 'no_hour') {
        target = 'bazi'; // Bát Tự tốt hơn khi thiếu giờ
      } else {
        target = 'ziwei';
      }
    } else {
      target = 'iching';
    }

    setSuggestedModule(MODULE_DEFINITIONS[target]);
    setStep(3);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedGoal(null);
    setSelectedInfo(null);
    setSuggestedModule(null);
  };

  const handleStartModule = () => {
    if (suggestedModule && onSelectModule) {
      onSelectModule(suggestedModule.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.12 }}
          className="relative w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto z-10 max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Lightbulb size={17} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-[Montserrat]">
                  Trợ Lý Gợi Ý Môn Học Thuật
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  30 giây tìm môn phù hợp nhất cho nhu cầu của bạn
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="w-full bg-slate-100 h-1">
            <div 
              className="bg-indigo-600 h-1 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto">
            {step === 1 && (
              /* BƯỚC 1: CHỌN MỤC TIÊU / NHU CẦU */
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="text-center max-w-md mx-auto space-y-1 mb-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Bước 1 / 2</span>
                  <h4 className="text-xl font-extrabold text-slate-900">
                    Nhu cầu trọng tâm hiện tại của bạn là gì?
                  </h4>
                  <p className="text-xs text-slate-500">
                    Chọn vấn đề bạn đang băn khoăn hoặc mong muốn khám phá nhất
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      id: 'urgent_action',
                      icon: Briefcase,
                      color: 'text-amber-600 bg-amber-50 border-amber-200',
                      title: 'Quyết định gấp hoặc việc cụ thể sắp diễn ra',
                      desc: 'Có nên đổi việc? Dự án đầu tư có thắng lợi? Hợp đồng này có nên ký?'
                    },
                    {
                      id: 'destiny_overview',
                      icon: Activity,
                      color: 'text-blue-600 bg-blue-50 border-blue-200',
                      title: 'Thấu hiểu bản thân, tiềm năng & vận mệnh trọn đời',
                      desc: 'Xem thời vận 100 năm, ngũ hành khuyết thiếu, Dụng Thần cải mệnh và nghề nghiệp phù hợp.'
                    },
                    {
                      id: 'twelve_palaces',
                      icon: BarChart3,
                      color: 'text-purple-600 bg-purple-50 border-purple-200',
                      title: 'Chi tiết 12 cung số: Sự nghiệp, tiền bạc, gia đạo, con cái',
                      desc: 'Xem đầy đủ tinh bàn 12 cung, tiểu hạn từng năm và kế sách phong thủy hóa giải.'
                    },
                    {
                      id: 'love',
                      icon: Heart,
                      color: 'text-rose-600 bg-rose-50 border-rose-200',
                      title: 'Xem tình duyên, độ hòa hợp 2 người & hôn nhân',
                      desc: 'So tuổi hợp khắc, mức độ gắn kết tâm lý và giải pháp duy trì hạnh phúc lứa đôi.'
                    },
                    {
                      id: 'event_date',
                      icon: Calendar,
                      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                      title: 'Chọn ngày lành tháng tốt cho đại sự sắp tới',
                      desc: 'Tìm ngày hoàng đạo động thổ, khai trương, cưới hỏi, xuất hành thu hút cát khí.'
                    }
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleGoalSelect(item.id)}
                        className="w-full p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-md transition-all flex items-start gap-3.5 text-left group cursor-pointer"
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 border ${item.color} group-hover:scale-105 transition-transform`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                          </h5>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-3" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              /* BƯỚC 2: CHỌN THÔNG TIN ĐANG CÓ */
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="text-center max-w-md mx-auto space-y-1 mb-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Bước 2 / 2</span>
                  <h4 className="text-xl font-extrabold text-slate-900">
                    Bạn hiện có những thông tin ngày giờ nào?
                  </h4>
                  <p className="text-xs text-slate-500">
                    Hệ thống sẽ lựa chọn môn có độ chính xác cao nhất tương ứng với thông tin bạn có
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      id: 'full_time',
                      icon: Clock,
                      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
                      title: 'Đầy đủ Ngày, Tháng, Năm và Giờ sinh chính xác',
                      desc: 'Đầy đủ cả 4 trụ, đạt độ chính xác tối đa để lập mệnh bàn chi tiết.'
                    },
                    {
                      id: 'no_hour',
                      icon: Calendar,
                      color: 'text-blue-600 bg-blue-50 border-blue-200',
                      title: 'Chỉ nhớ Ngày, Tháng, Năm sinh (Không nhớ giờ sinh)',
                      desc: 'Vẫn phân tích được năng lượng 3 trụ (Năm, Tháng, Ngày) sâu sắc.'
                    },
                    {
                      id: 'no_birthdate',
                      icon: HelpCircle,
                      color: 'text-amber-600 bg-amber-50 border-amber-200',
                      title: 'Không có ngày sinh (Chỉ có sự việc hoặc câu hỏi)',
                      desc: 'Xem bằng quẻ dịch biến hóa theo tâm niệm và thời điểm đặt câu hỏi.'
                    },
                    {
                      id: 'both_partners',
                      icon: UserCheck,
                      color: 'text-rose-600 bg-rose-50 border-rose-200',
                      title: 'Có thông tin ngày tháng năm của cả hai người',
                      desc: 'Phù hợp đối chiếu tương tác ngũ hành và cung mệnh của cặp đôi.'
                    }
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleInfoSelect(item.id)}
                        className="w-full p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-md transition-all flex items-start gap-3.5 text-left group cursor-pointer"
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 border ${item.color} group-hover:scale-105 transition-transform`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                          </h5>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-3" />
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                  >
                    ← Quay lại bước trước
                  </button>
                </div>
              </div>
            )}

            {step === 3 && suggestedModule && (
              /* BƯỚC 3: KẾT QUẢ GỢI Ý MÔN HỌC THUẬT HOÀN HẢO */
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Card Gợi Ý Chính */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-100 text-center relative overflow-hidden shadow-xs">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-600 text-white mb-3 shadow-md shadow-indigo-600/20">
                    <Sparkles size={12} />
                    <span>LỰA CHỌN PHÙ HỢP NHẤT: {suggestedModule.badge}</span>
                  </div>

                  <h4 className="text-2xl sm:text-3xl font-black text-slate-900 font-[Montserrat]">
                    {suggestedModule.title}
                  </h4>
                  <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider block mt-1">
                    {suggestedModule.tag}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 mt-3 max-w-md mx-auto leading-relaxed">
                    {suggestedModule.description}
                  </p>
                </div>

                {/* 3 Lý Do Tại Sao Nên Chọn Môn Này */}
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-2.5">
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Tại sao môn này tối ưu cho bạn?</span>
                  </h5>
                  <div className="space-y-1.5">
                    {suggestedModule.whyChoose.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lời Khuyên Nhỏ */}
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="font-bold">Mẹo nhỏ: </strong>
                    {suggestedModule.tip}
                  </p>
                </div>

                {/* Nút Bấm Hành Động */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleStartModule}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Khởi Đầu Với {suggestedModule.title} Ngay</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Làm lại trắc nghiệm</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

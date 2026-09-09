import React, { useState, useEffect } from 'react';
import { X, FileDown, CheckSquare, Square, AlertCircle, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { exportPdf } from '../services/api';

export default function PdfExportModal({
  isOpen,
  onClose,
  system = 'bazi',
  recordId,
  recordData,
  hasInterpretation = false,
  interpretationMode = 'standard',
  rawInterpretation = ''
}) {
  if (!isOpen) return null;

  // Cấu hình các mục theo từng phân hệ
  const getSectionsConfig = () => {
    const chartSections = [];
    if (system === 'bazi') {
      chartSections.push(
        { id: 'bazi_pillars', label: 'Tứ Trụ Bản Mệnh (Năm - Tháng - Ngày - Giờ)', desc: 'Thiên can, Địa chi, Thập thần, Tàng can, Nạp âm' },
        { id: 'bazi_dayun', label: 'Ma Trận Đại Vận 100 Năm (2 Hàng x 5 Cột)', desc: 'Bố cục niên biểu khoa học, huy hiệu Cát/Hung theo Dụng Thần' },
        { id: 'bazi_wuxing', label: 'Cân Bằng Ngũ Hành & Trạng Thái Thân', desc: 'Tỷ lệ % 5 hành, Dụng Thần, Hỷ Thần, Kỵ Thần' },
        { id: 'bazi_shensha', label: 'Thần Sát Tứ Trụ, Cung Mệnh & Thai Nguyên', desc: 'Thần Sát phân loại Cát / Hung / Lưỡng tính theo từng trụ' }
      );
    } else if (system === 'ziwei' || system === 'tu-vi') {
      chartSections.push(
        { id: 'ziwei_grid', label: 'Mệnh Bàn Tử Vi 12 Cung (Lưới 4x4)', desc: 'Chính tinh đắc hãm, Tứ Hóa, Cát/Sát tinh, Trung Cung bản mệnh' }
      );
    } else if (system === 'iching' || system === 'hexagrams') {
      chartSections.push(
        { id: 'iching_table', label: 'Bảng Lục Hào Lạc Giáp & Đồ Hình 3 Quẻ', desc: 'Quẻ Chủ, Quẻ Hỗ, Quẻ Biến, Lục Hào nạp giáp & Trạng thái vượng suy các hào' },
        { id: 'iching_analysis', label: 'Khối Phân Tích Dịch Lý Cốt Lõi', desc: 'Dụng Thần, Tương Quan Thế - Ứng, Hào Động & Biến Số, Trạng Thái' },
        { id: 'iching_ungky', label: 'Bảng Niên Lịch Ứng Kỳ Dự Báo', desc: 'Thời điểm biến chuyển cát hung theo ngày tháng âm dương' }
      );
    } else if (system === 'marriage') {
      chartSections.push(
        { id: 'marriage_compare', label: 'Đối Chiếu 5 Tiêu Chí Cổ Học & Tỷ Lệ Ngũ Hành', desc: 'Nạp Âm, Thiên Can, Địa Chi Phu Thê, Cung Phi Bát Trạch, Hỷ Kỵ Dụng Thần & Tỷ lệ 5 hành' },
        { id: 'marriage_pillars', label: 'Cấu Trúc Tứ Trụ Can Chi (Nam Trên - Nữ Dưới)', desc: 'Tứ Trụ Chồng & Vợ: Thập Thần, Can Chi, Nạp Âm, Tàng Can' }
      );
    }

    const interpretSections = [];
    if (hasInterpretation) {
      if (system === 'iching' || system === 'hexagrams') {
        interpretSections.push(
          { id: 'intro', label: 'Toàn Văn Luận Giải Chu Dịch', desc: 'Luận đoán chi tiết sự việc, hào động và lời khuyên định hướng' }
        );
      } else if (system === 'ziwei') {
        interpretSections.push(
          { id: 'intro', label: 'Toàn Văn Luận Giải 12 Cung & Vận Hạn', desc: 'Luận giải chi tiết bản mệnh, các cung vị và phương pháp cải vận phong thủy' }
        );
      } else if (system === 'marriage') {
        interpretSections.push(
          { id: 'intro', label: 'Toàn Văn Luận Giải Hợp Hôn & Hòa Hợp Gia Đạo', desc: 'Chi tiết mức độ tương hợp Bát Tự, Mệnh Quái và chiến lược hòa hợp gia đạo' }
        );
      } else {
        // Bát Tự
        const isVip = interpretationMode === 'vip' || (rawInterpretation && /(?:CHƯƠNG|Chương)\s*1/i.test(rawInterpretation));
        const hasSteps = rawInterpretation && /(?:BƯỚC|Bước)\s*1/i.test(rawInterpretation);
        if (isVip) {
          interpretSections.push(
            { id: 'nhat_chu', label: 'Phân Tích Nhật Chủ: Gốc Rễ Bản Thể & Mệnh Cách', desc: 'Định vị cốt lõi tính cách và tiềm năng thiên phú' },
            { id: 'ch1', label: 'Chương 1: Bản Mệnh, Sự Nghiệp & Đỉnh Cao Công Danh', desc: 'Ngành nghề phù hợp, thời vận phát triển rực rỡ nhất' },
            { id: 'ch2', label: 'Chương 2: Tài Vận, Đầu Tư & Quản Trị Tiền Bạc', desc: 'Chu kỳ thịnh suy, khả năng tích lũy, phòng ngừa hao tài' },
            { id: 'ch3', label: 'Chương 3: Hôn Nhân, Tình Duyên & Gia Đạo Hậu Vận', desc: 'Hình mẫu bạn đời tương hợp, biến cố tình cảm' },
            { id: 'ch4', label: 'Chương 4: Sức Khỏe & Dự Báo Tật Ách Đông Y', desc: 'Cân bằng tạng phủ, mốc tuổi có hạn sức khỏe lưu tâm' },
            { id: 'ch5', label: 'Chương 5: Phong Thủy & Cải Vận Thực Chiến', desc: 'Màu sắc, phương hướng, chiến lược bổ khuyết ngũ hành' },
            { id: 'ch6', label: 'Chương 6: Lộ Trình Đại Vận 100 Năm & 3 Bước Ngoặt', desc: '3 mốc thời gian làm thay đổi hoàn toàn cuộc đời' },
            { id: 'harmonizer', label: 'Chuyên Đề: Điều Hòa Chiến Lược Đa Mục Tiêu', desc: 'Tổng kết chiến lược nhân sinh toàn diện' }
          );
        } else if (hasSteps) {
          interpretSections.push(
            { id: 'step_1', label: 'Bước 1: Phân Tích Nhật Chủ (Gốc Rễ Bản Thể)', desc: 'Bản chất Can ngày sinh, đánh giá đắc lệnh, đắc địa, đắc thế' },
            { id: 'step_2', label: 'Bước 2: Định Cách Cục & Tìm Dụng Thần', desc: 'Định danh cách cục, xác định Dụng Thần, Hỷ Thần, Kỵ Thần' },
            { id: 'step_3', label: 'Bước 3: Luận Giải Chi Tiết Các Phương Diện Đời Người', desc: 'Sự nghiệp, tài chính, tình duyên hôn nhân, sức khỏe' },
            { id: 'step_4', label: 'Bước 4: Giải Mã Thần Sát (Gia Vị Của Lá Số)', desc: 'Tổng hòa Thần Sát trên 4 trụ và Thai Mệnh' },
            { id: 'step_5', label: 'Bước 5: Luận Đại Vận & Lưu Niên (Dòng Chảy Thời Gian)', desc: 'Các bước Đại vận quan trọng và biến chuyển cát hung' },
            { id: 'step_6', label: 'Bước 6: Tổng Kết & Chiến Lược Cải Vận Thực Tế', desc: 'Kim chỉ nam hành động và phương pháp phong thủy bổ trợ' }
          );
        } else {
          interpretSections.push(
            { id: 'intro', label: 'Toàn Văn Bài Luận Giải Tiêu Chuẩn', desc: 'Giải đoán chi tiết toàn diện từ hệ thống AI' }
          );
        }
      }
    }

    return { chartSections, interpretSections };
  };

  const { chartSections, interpretSections } = getSectionsConfig();

  // Khởi tạo state: Mặc định chọn tất cả các mục hợp lệ
  const allAvailableIds = [
    ...chartSections.map(s => s.id),
    ...(hasInterpretation ? interpretSections.map(s => s.id) : [])
  ];

  const [selectedIds, setSelectedIds] = useState(allAvailableIds);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Reset selection khi modal mở
    setSelectedIds(allAvailableIds);
    setErrorMessage('');
  }, [isOpen, recordId, hasInterpretation]);

  const toggleItem = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(allAvailableIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const selectedCount = selectedIds.length;
  const isNoneSelected = selectedCount === 0;

  // Thực hiện tải file PDF
  const handleDownloadPdf = async () => {
    if (isNoneSelected || isDownloading) return;

    setIsDownloading(true);
    setErrorMessage('');

    try {
      const response = await exportPdf(system, recordId, selectedIds);
      
      // Lấy tên file từ Content-Disposition nếu có
      let filename = `La_So_${system.toUpperCase()}_${Date.now()}.pdf`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Tạo Blob và trigger tải file
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Đóng modal sau khi tải xong thành công
      setTimeout(() => {
        setIsDownloading(false);
        onClose();
      }, 500);
    } catch (err) {
      setIsDownloading(false);
      console.error('Lỗi khi tải PDF:', err);

      if (err.response) {
        let serverError = '';
        if (err.response.data instanceof Blob) {
          try {
            const errorText = await err.response.data.text();
            const parsed = JSON.parse(errorText);
            serverError = parsed.error || parsed.message;
          } catch (_) {}
        } else if (err.response.data && err.response.data.error) {
          serverError = err.response.data.error;
        }

        if (serverError) {
          setErrorMessage(serverError);
        } else if (err.response.status === 401) {
          setErrorMessage('Vui lòng đăng nhập để tải bản ghi riêng tư này.');
        } else if (err.response.status === 403) {
          setErrorMessage('Bản ghi này ở chế độ riêng tư. Chỉ chính chủ sở hữu mới có quyền tải tệp PDF.');
        } else if (err.response.status === 429) {
          setErrorMessage('Bạn đã yêu cầu xuất tệp PDF quá nhanh (giới hạn 5 lượt/phút). Vui lòng đợi 1 phút trước khi thử lại.');
        } else {
          setErrorMessage('Không thể xuất tệp PDF vào lúc này. Vui lòng kiểm tra lại quyền truy cập hoặc thử lại sau.');
        }
      } else {
        setErrorMessage('Lỗi kết nối tới máy chủ. Vui lòng kiểm tra đường truyền mạng.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-amber-100/80 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Header Modal */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/20">
              <FileDown size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Ấn Phẩm Học Thuật
                </span>
                <span className="text-xs text-slate-400 font-semibold">Chuẩn in ấn A4</span>
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight mt-0.5">
                Xuất Bản Tệp PDF Hồ Sơ
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Thanh Chọn Nhanh (Select All / Deselect All) */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600">
          <span>Đã chọn: <strong className="text-amber-700 font-black">{selectedCount}</strong> / {allAvailableIds.length} mục</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isDownloading}
              className="px-2.5 py-1 text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer font-bold"
            >
              Chọn tất cả
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={isDownloading}
              className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded-lg transition-all cursor-pointer font-bold"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        {/* Body Nội Dung Cuộn */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-bold animate-in fade-in">
              <ShieldAlert size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* NHÓM 1: ĐỒ HÌNH LÁ SỐ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-amber-600" />
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                1. Đồ Hình Lá Số & Vận Trình
              </h4>
            </div>
            <div className="space-y-2">
              {chartSections.map((item) => {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => !isDownloading && toggleItem(item.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isChecked ? (
                        <CheckSquare size={18} className="text-amber-600" />
                      ) : (
                        <Square size={18} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-xs md:text-sm">{item.label}</div>
                      <div className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NHÓM 2: BẢN LUẬN GIẢI AI */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  2. Toàn Văn Bài Luận Giải AI
                </h4>
              </div>
              {hasInterpretation && interpretationMode === 'vip' && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Bản VIP 6 Chương
                </span>
              )}
            </div>

            {!hasInterpretation ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-1">
                <div className="text-xs font-bold text-slate-500">Chưa có bản luận giải AI cho hồ sơ này</div>
                <div className="text-[11px] text-slate-400">
                  Bạn có thể xuất Đồ hình Lá số ở mục trên, hoặc bấm "Luận Giải" trên màn hình để AI tiến hành phân tích trước khi xuất mục này.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {interpretSections.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isDownloading && toggleItem(item.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-indigo-50/40 border-indigo-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="pt-0.5">
                        {isChecked ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 text-xs md:text-sm">{item.label}</div>
                        <div className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer & Nút Tải */}
        <div className="p-5 md:p-6 bg-slate-50/80 border-t border-slate-200/80 space-y-3">
          
          {/* Banner Cảnh Báo Nếu Không Chọn Ô Nào */}
          {isNoneSelected && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs font-bold animate-in fade-in slide-in-from-bottom-1">
              <AlertCircle size={18} className="shrink-0 text-amber-600" />
              <span>Vui lòng chọn ít nhất 1 mục nội dung phía trên để hệ thống tạo tệp PDF.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDownloading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isNoneSelected || isDownloading}
              className={`px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-all ${
                isNoneSelected || isDownloading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 active:scale-95 cursor-pointer'
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang kết xuất PDF...</span>
                </>
              ) : (
                <>
                  <FileDown size={16} />
                  <span>Tải Xuống Tệp PDF ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

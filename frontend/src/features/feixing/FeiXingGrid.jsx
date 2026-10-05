import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  ShieldAlert, 
  X, 
  Home, 
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FeiXingCombinedDial from './FeiXingCombinedDial';

export default function FeiXingGrid({ 
  grid = [], 
  facingPalace, 
  sittingPalace, 
  facingMountain, 
  sittingMountain, 
  ownerProfile = null 
}) {
  const [selectedCell, setSelectedCell] = useState(null);

  return (
    <div className="w-full flex flex-col items-center select-none font-sans">
      {/* Tinh Bàn Cửu Cung Master: Kết Hợp Vành La Kinh 24 Sơn (Hình 1) & Ma Trận 9 Cung (Hình 2) */}
      <FeiXingCombinedDial
        grid={grid}
        facingPalace={facingPalace}
        sittingPalace={sittingPalace}
        facingMountain={facingMountain}
        sittingMountain={sittingMountain}
        onSelectCell={setSelectedCell}
      />

      {/* Legend & Chú Giải Màu Sắc & Ký Hiệu Mũi Tên */}
      <div className="w-full max-w-[540px] sm:max-w-[580px] lg:max-w-[620px] mt-2.5 p-2.5 sm:p-3 rounded-2xl bg-white border border-amber-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 sm:gap-x-3 gap-y-1 text-[10.5px] sm:text-[11px] text-slate-700">
          <span className="font-bold text-slate-900">Quy ước:</span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span> Cát / Vượng
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span> Tiến khí
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0"></span> Bình thường
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-red-700">
            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span> Hung sát
          </span>
        </div>

        <div className="flex items-center gap-x-3 text-[10.5px] sm:text-[11px] text-slate-600 shrink-0">
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
            <span className="text-emerald-600 font-black">↗</span> Thuận (+)
          </span>
          <span className="text-slate-300">|</span>
          <span className="inline-flex items-center gap-1 font-bold text-rose-700">
            <span className="text-rose-600 font-black">↘</span> Nghịch (-)
          </span>
        </div>
      </div>

      {/* Modal / Drawer Chi Tiết Cung Đã Chọn (Light Luxury Theme) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedCell && (
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedCell(null);
              }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            >
              <motion.div
                key={selectedCell.palaceKey || 'palace-modal'}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-lg w-full p-6 border-2 border-amber-300 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col font-sans cursor-default"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 transition border border-amber-200"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Modal Header */}
                <div className="border-b border-amber-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center font-black text-xl shadow-inner">
                      {selectedCell.baseStar}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">
                        Cung {selectedCell.palaceName}{selectedCell.directionName && selectedCell.directionName !== 'Trung Tâm' ? ` — ${selectedCell.directionName}` : ''}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {selectedCell.elementRelation} • Vị trí: {selectedCell.palaceName === facingPalace ? 'Cung Hướng (Minh Đường)' : selectedCell.palaceName === sittingPalace ? 'Cung Tọa (Hậu Trạch)' : 'Cung Phối Trạch'}
                      </p>
                    </div>
                  </div>

                  {/* Stars Trio Pill */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-indigo-50 rounded-2xl p-2.5 text-center border border-indigo-200 shadow-sm">
                      <div className="text-[10px] font-bold text-indigo-700">SƠN TINH</div>
                      <div className="text-2xl font-black text-indigo-900">
                        {selectedCell.mountainStar}
                      </div>
                      <div className="text-[10px] text-indigo-600">
                        {selectedCell.mountainFlight === 'FORWARD' ? 'Bay Thuận ↗' : 'Bay Nghịch ↘'}
                      </div>
                    </div>

                    <div className="bg-amber-50 rounded-2xl p-2.5 text-center border border-amber-200 shadow-sm">
                      <div className="text-[10px] font-bold text-amber-700">VẬN TINH</div>
                      <div className="text-2xl font-black text-amber-950">
                        {selectedCell.periodStar}
                      </div>
                      <div className="text-[10px] text-amber-700">Thiên Bàn</div>
                    </div>

                    <div className="bg-rose-50 rounded-2xl p-2.5 text-center border border-rose-200 shadow-sm">
                      <div className="text-[10px] font-bold text-rose-700">HƯỚNG TINH</div>
                      <div className="text-2xl font-black text-rose-900">
                        {selectedCell.waterStar}
                      </div>
                      <div className="text-[10px] text-rose-600">
                        {selectedCell.waterFlight === 'FORWARD' ? 'Bay Thuận ↗' : 'Bay Nghịch ↘'}
                      </div>
                    </div>
                  </div>

                  {/* Bát Trạch Star of Gia Chủ */}
                  {selectedCell.batTrachStar && (
                    <div className="mt-3 p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                        Sao Bát Trạch Gia Chủ: <b>{selectedCell.batTrachStar}</b>
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {selectedCell.batTrachDesc}
                      </span>
                    </div>
                  )}
                </div>

                {/* Scrollable Modal Content */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm">
                  {/* Meaning of the star combination */}
                  <div className="bg-amber-50/40 rounded-2xl p-4 border border-amber-200/80">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Luận Đoán Cặp Sao Phi Tinh ({selectedCell.mountainStar} - {selectedCell.waterStar})
                    </div>
                    <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                      {selectedCell.starPairMeaning}
                    </p>
                  </div>

                  {/* Recommended Rooms */}
                  <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-2">
                      <Home className="w-4 h-4 text-emerald-600" />
                      Không Gian Công Năng Phù Hợp
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCell.recommendedRooms?.map((room, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-xl bg-white text-xs font-semibold text-emerald-800 border border-emerald-300 shadow-sm">
                          {room}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Feng Shui Remedy / Activation */}
                  <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-300">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950 mb-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Pháp Bảo Phong Thủy Kích Hoạt & Hóa Giải
                    </div>
                    <p className="text-slate-800 leading-relaxed text-xs sm:text-sm">
                      {selectedCell.curesAndActivators}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

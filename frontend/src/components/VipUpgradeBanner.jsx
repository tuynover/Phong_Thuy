import React from 'react';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';

const VipUpgradeBanner = ({ onUpgradeClick, userCredits = 0 }) => {
  return (
    <div className="w-full bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/40 rounded-2xl p-4 mb-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            Muốn xem bài phân tích sâu sắc hơn?
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Chuyên Sâu 6 Chương
            </span>
          </h4>
          <p className="text-xs text-slate-300">
            Nâng cấp sang Luận Giải Chuyên Sâu (5.000+ từ) với chi phí 4 Credits.
          </p>
        </div>
      </div>

      <button
        onClick={onUpgradeClick}
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 shrink-0"
      >
        <Zap className="w-4 h-4 fill-current" />
        Nâng Cấp Luận Giải
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default VipUpgradeBanner;

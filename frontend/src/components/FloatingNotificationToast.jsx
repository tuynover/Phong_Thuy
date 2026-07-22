import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function FloatingNotificationToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white/95 text-slate-800 p-3.5 px-4 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md border border-slate-200/80">
        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
        <span className="text-xs sm:text-sm font-bold leading-relaxed">{message}</span>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * Fixed Floating Toast Notification pinned to the top center of the viewport.
 * White background, dark text, red exclamation icon, auto-dismiss in 3 seconds.
 */
const FloatingErrorToast = ({ message, onClose }) => {
  useEffect(() => {
    if (!message || !onClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, 1500);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-lg bg-white border border-red-200 text-slate-900 font-bold p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3 text-sm md:text-base">
        <div className="p-2 rounded-xl bg-red-50 text-red-600 shrink-0">
          <AlertCircle size={22} className="text-red-600 stroke-[2.5]" />
        </div>
        <span className="leading-snug text-slate-800 font-bold">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors shrink-0 text-slate-400 hover:text-slate-700"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default FloatingErrorToast;

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import useNetworkStatus from '@/hooks/useNetworkStatus';

export default function NetworkStatusBanner() {
  const { isOnline, wasOffline, resetWasOffline } = useNetworkStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setDismissed(false);
      setShowRestored(false);
    } else if (wasOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        resetWasOffline();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  if (dismissed || (isOnline && !showRestored)) {
    return null;
  }

  return (
    <div
      role="alert"
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[92%] sm:w-auto px-4 py-2.5 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium transition-all duration-300 animate-in slide-in-from-top-4 ${
        !isOnline
          ? 'bg-rose-950/95 text-rose-200 border-rose-800/80 backdrop-blur-md'
          : 'bg-emerald-950/95 text-emerald-200 border-emerald-800/80 backdrop-blur-md'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {!isOnline ? (
          <>
            <div className="p-1.5 rounded-xl bg-rose-900/50 text-rose-400 animate-pulse">
              <WifiOff size={16} />
            </div>
            <div>
              <span className="font-bold block text-slate-100">Mất kết nối Internet</span>
              <span className="text-[11px] text-rose-300/80">Vui lòng kiểm tra lại đường truyền Wi-Fi / 4G của bạn.</span>
            </div>
          </>
        ) : (
          <>
            <div className="p-1.5 rounded-xl bg-emerald-900/50 text-emerald-400">
              <Wifi size={16} />
            </div>
            <div>
              <span className="font-bold block text-slate-100">Đã khôi phục kết nối</span>
              <span className="text-[11px] text-emerald-300/80">Hệ thống đã sẵn sàng tiếp tục hoạt động.</span>
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors ml-2"
        aria-label="Đóng thông báo"
      >
        <X size={14} />
      </button>
    </div>
  );
}

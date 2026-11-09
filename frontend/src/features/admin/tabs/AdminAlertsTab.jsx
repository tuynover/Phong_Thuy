import React, { useState, useEffect } from 'react';
import {
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  resolveAdminAppeal
} from '@/services/api';
import {
  AlertTriangle,
  MessageSquare,
  Check,
  CheckCheck,
  X
} from 'lucide-react';
import { useAdminTheme } from '@/features/admin/context/AdminThemeContext';

export default function AdminAlertsTab({
  alerts = [],
  setAlerts,
  appeals = [],
  setAppeals: _setAppeals,
  showAlert,
  showConfirm,
  onGoToUser,
  fetchAlertsAndAppeals,
  onDirtyAnalytics
}) {
  const { isLight } = useAdminTheme();
  const [markingAll, setMarkingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleMarkAlertRead = async (alertId) => {
    try {
      if (setAlerts) {
        setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'read' } : a));
      }
      await markAdminNotificationRead(alertId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAlertsRead = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (markingAll) return;

    setMarkingAll(true);
    // Optimistic UI update: Đổi ngay trạng thái thành 'read' mà không cần reload trang
    if (setAlerts) {
      setAlerts(prev => prev.map(a => ({ ...a, status: 'read' })));
    }

    try {
      await markAllAdminNotificationsRead();
      setToastMessage('Đã đánh dấu đọc tất cả cảnh báo thành công!');
      if (fetchAlertsAndAppeals) fetchAlertsAndAppeals();
    } catch (err) {
      console.error('Error marking all alerts as read:', err);
      setToastMessage(err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật cảnh báo.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleResolveAppeal = async (appealId, action) => {
    const actionStr = action === 'approve' ? 'chấp thuận (mở khóa tài khoản)' : 'bác bỏ khiếu nại';
    showConfirm(`Bạn có chắc chắn muốn ${actionStr} này?`, async () => {
      try {
        await resolveAdminAppeal(appealId, action);
        setToastMessage(`Đã ${actionStr} thành công.`);
        if (onDirtyAnalytics) onDirtyAnalytics();
        if (fetchAlertsAndAppeals) fetchAlertsAndAppeals();
      } catch (err) {
        if (showAlert) showAlert(err.response?.data?.error || 'Có lỗi xảy ra khi xử lý khiếu nại.', 'error');
      }
    });
  };

  const unreadAlertsCount = alerts.filter(a => a.status === 'unread').length;

  return (
    <div className="relative space-y-6 animate-in fade-in duration-300">
      
      {/* 2-SECOND TOAST NOTIFICATION (NO MODAL, NO PAGE RELOAD) */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
            isLight
              ? 'bg-white text-emerald-800 border-emerald-200 shadow-emerald-500/10'
              : 'bg-slate-900 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
          }`}>
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SYSTEM SPIKE WARNINGS */}
        <div className={`border rounded-3xl p-4 sm:p-6 space-y-4 transition-all duration-200 ${
          isLight
            ? 'bg-white border-slate-200/80 shadow-sm text-slate-800'
            : 'bg-slate-950/40 border-slate-800 text-slate-100'
        }`}>
          <div className="flex items-center justify-between gap-2 flex-wrap border-b pb-3 border-slate-200/60 dark:border-slate-800/60">
            <div>
              <h3 className="font-serif text-lg font-bold text-red-500 flex items-center gap-2">
                <AlertTriangle size={20} />
                Cảnh Báo Vượt Ngưỡng Tài Nguyên
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Danh sách cảnh báo do hệ thống tự động ghi nhận khi phát hiện lưu lượng tăng đột biến
              </p>
            </div>

            {unreadAlertsCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAlertsRead}
                disabled={markingAll}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border active:scale-95 ${
                  isLight
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-rose-500/5'
                    : 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-800/60'
                }`}
                title="Đánh dấu tất cả cảnh báo là đã đọc"
              >
                <CheckCheck size={14} className={markingAll ? 'animate-pulse' : 'text-rose-600'} />
                <span>{markingAll ? 'Đang xử lý...' : `Đọc tất cả (${unreadAlertsCount})`}</span>
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {alerts.length > 0 ? (
              alerts.map((al) => (
                <div
                  key={al._id}
                  className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between gap-2.5 transition-all ${
                    al.status === 'unread'
                      ? (isLight ? 'bg-rose-50/60 border-rose-200 shadow-sm' : 'bg-red-950/25 border-red-800/60')
                      : (isLight ? 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100/60' : 'bg-slate-900/40 border-slate-800')
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                        {al.title}
                      </span>
                      <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {al.message}
                      </p>
                      <span className={`text-[10px] block mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        Ghi nhận: {new Date(al.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase shrink-0 border ${
                      al.status === 'unread'
                        ? (isLight ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-red-850 text-white animate-pulse border-red-700')
                        : (isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-500 border-slate-700')
                    }`}>
                      {al.status === 'unread' ? 'Mới' : 'Đã Đọc'}
                    </span>
                  </div>

                  {al.status === 'unread' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMarkAlertRead(al._id);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                          isLight
                            ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        <Check size={12} /> Đánh dấu đã đọc
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={`p-8 text-center text-xs rounded-2xl border border-dashed ${
                isLight ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-500'
              }`}>
                Không có cảnh báo bất thường nào từ hệ thống.
              </div>
            )}
          </div>
        </div>

        {/* ACCOUNT APPEALS */}
        <div className={`border rounded-3xl p-4 sm:p-6 space-y-4 transition-all duration-200 ${
          isLight
            ? 'bg-white border-slate-200/80 shadow-sm text-slate-800'
            : 'bg-slate-950/40 border-slate-800 text-slate-100'
        }`}>
          <div className="border-b pb-3 border-slate-200/60 dark:border-slate-800/60">
            <h3 className="font-serif text-lg font-bold text-amber-500 flex items-center gap-2">
              <MessageSquare size={20} />
              Khiếu Nại Tài Khoản ({appeals.length})
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Danh sách khiếu nại do người dùng bị khóa tài khoản gửi lên yêu cầu xem xét
            </p>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {appeals.length > 0 ? (
              appeals.map((ap) => (
                <div
                  key={ap._id}
                  className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between gap-3 transition-all ${
                    isLight
                      ? 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100/60'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onGoToUser && onGoToUser(ap.userId)}
                        className={`font-bold hover:underline cursor-pointer ${
                          isLight ? 'text-blue-700' : 'text-blue-400'
                        }`}
                        title="Xem tài khoản này trong tab Thành Viên"
                      >
                        {ap.email || ap.userId}
                      </button>
                      <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(ap.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className={`text-[11px] font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Lý do bị khóa: <span className="text-red-500 font-normal">{ap.reason}</span>
                      </p>
                      <p className={`text-[11px] italic p-2 rounded-xl border ${
                        isLight
                          ? 'bg-white text-slate-600 border-slate-200'
                          : 'bg-slate-950/60 text-slate-300 border-slate-800/80'
                      }`}>
                        "{ap.message}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => handleResolveAppeal(ap._id, 'reject')}
                      className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200'
                          : 'bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border-slate-700'
                      }`}
                    >
                      <X size={13} /> Bác Bỏ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveAppeal(ap._id, 'approve')}
                      className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        isLight
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                      }`}
                    >
                      <Check size={13} /> Mở Khóa Tài Khoản
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={`p-8 text-center text-xs rounded-2xl border border-dashed ${
                isLight ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-500'
              }`}>
                Không có khiếu nại nào đang chờ xử lý.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

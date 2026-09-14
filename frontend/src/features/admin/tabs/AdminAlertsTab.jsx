import React from 'react';
import {
  markAdminNotificationRead,
  resolveAdminAppeal
} from '@/services/api';
import {
  AlertTriangle,
  MessageSquare,
  Check,
  X
} from 'lucide-react';

export default function AdminAlertsTab({
  alerts = [],
  setAlerts,
  appeals = [],
  setAppeals,
  showAlert,
  showConfirm,
  onGoToUser,
  fetchAlertsAndAppeals,
  onDirtyAnalytics
}) {
  const handleMarkAlertRead = async (alertId) => {
    try {
      await markAdminNotificationRead(alertId);
      if (setAlerts) {
        setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'read' } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveAppeal = async (appealId, action) => {
    const actionStr = action === 'approve' ? 'chấp thuận (mở khóa tài khoản)' : 'bác bỏ khiếu nại';
    showConfirm(`Bạn có chắc chắn muốn ${actionStr} này?`, async () => {
      try {
        await resolveAdminAppeal(appealId, action);
        showAlert(`Đã ${actionStr} thành công.`, 'success');
        if (onDirtyAnalytics) onDirtyAnalytics();
        if (fetchAlertsAndAppeals) fetchAlertsAndAppeals();
      } catch (err) {
        showAlert(err.response?.data?.error || 'Có lỗi xảy ra khi xử lý khiếu nại.', 'error');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
      
      {/* SYSTEM SPIKE WARNINGS */}
      <div className="bg-slate-950/20 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle size={20} />
            Cảnh Báo Vượt Ngưỡng Tài Nguyên
          </h3>
          <p className="text-xs text-slate-400">Danh sách cảnh báo do hệ thống tự động ghi nhận khi phát hiện lưu lượng tăng đột biến</p>
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {alerts.length > 0 ? (
            alerts.map((al) => (
              <div
                key={al._id}
                className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-2.5 transition-all ${al.status === 'unread' ? 'bg-red-950/25 border-red-800/60' : 'bg-slate-900/40 border-slate-800'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-200 text-xs">{al.title}</span>
                    <p className="text-slate-400 text-[11px] mt-1">{al.message}</p>
                    <span className="text-[10px] text-slate-500 block mt-1">Ghi nhận: {new Date(al.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase shrink-0 ${al.status === 'unread' ? 'bg-red-850 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                    {al.status === 'unread' ? 'Mới' : 'Đã Đọc'}
                  </span>
                </div>

                {al.status === 'unread' && (
                  <button
                    onClick={() => handleMarkAlertRead(al._id)}
                    className="self-end bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-slate-100 font-semibold px-3 py-1 rounded-lg text-[10px] transition-colors cursor-pointer"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm font-semibold">
              Hệ thống hoạt động ổn định. Không có cảnh báo tài nguyên.
            </div>
          )}
        </div>
      </div>

      {/* BAN APPEALS COMPLAINTS LIST */}
      <div className="bg-slate-950/20 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-amber-500 flex items-center gap-2">
            <MessageSquare size={20} />
            Đơn Khiếu Nại Tài Khoản
          </h3>
          <p className="text-xs text-slate-400">Yêu cầu xem xét mở khóa tài khoản do người dùng gửi lên (Click vào thẻ để kiểm tra hội viên)</p>
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {appeals.length > 0 ? (
            appeals.map((ap) => (
              <div
                key={ap._id}
                onClick={() => onGoToUser && onGoToUser(ap.email, ap.userId)}
                className="p-4 rounded-xl border bg-slate-950/40 border-slate-800 hover:border-amber-500/50 cursor-pointer text-xs space-y-3 transition-all duration-200"
              >
                <div>
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="font-bold text-slate-200 break-all">Email: {ap.email}</span>
                    <span className="text-[10px] font-mono text-slate-500">ID: {ap.userId}</span>
                  </div>
                  <div className="text-[11px] text-red-400 font-semibold mt-1">Lý do khóa: "{ap.reason}"</div>
                </div>

                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850 text-slate-300 italic text-[11px]">
                  "{ap.message}"
                </div>

                <div className="text-[10px] text-slate-500 block">Thời gian gửi: {new Date(ap.createdAt).toLocaleString('vi-VN')}</div>

                <div className="flex items-center gap-2 justify-end pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleResolveAppeal(ap._id, 'approve')}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={12} />
                    Mở Khóa
                  </button>
                  <button
                    onClick={() => handleResolveAppeal(ap._id, 'reject')}
                    className="bg-red-800/80 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <X size={12} />
                    Bác Bỏ
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm font-semibold">
              Không có đơn khiếu nại tài khoản nào đang chờ xử lý.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

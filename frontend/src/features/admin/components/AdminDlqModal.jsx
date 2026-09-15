import React, { useState } from 'react';
import { Mail, X, RefreshCw, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function AdminDlqModal({
  isOpen,
  onClose,
  dlqJobs = [],
  onRetryJob,
  onClearDlq,
  onRefresh,
  loading
}) {
  const [retryingJobId, setRetryingJobId] = useState(null);

  if (!isOpen) return null;

  const handleRetry = async (jobId) => {
    setRetryingJobId(jobId);
    try {
      await onRetryJob(jobId);
    } finally {
      setRetryingJobId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] p-5 sm:p-6 relative shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-950/40 text-rose-500 rounded-xl border border-rose-800/40">
              <Mail size={22} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
                Hàng Đợi Thư Lỗi (Dead Letter Queue)
                {dlqJobs.length > 0 && (
                  <span className="text-xs bg-rose-950/60 text-rose-400 font-sans border border-rose-800/60 px-2 py-0.5 rounded-full">
                    {dlqJobs.length} lỗi
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Các email gặp lỗi mạng hoặc SMTP quá 3 lần được lưu vết tại đây để bảo toàn dữ liệu.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Làm mới"
              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin text-amber-500' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {dlqJobs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
                <CheckCircle size={28} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Không có thư lỗi trong hàng đợi</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Toàn bộ email xác thực OTP và thông báo ứng kỳ đều được phân phối trơn tru hoặc đang trong tiến trình gửi bình thường.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {dlqJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700/80 transition-all"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-200 text-sm">{job.to}</span>
                      <span className="text-xs bg-rose-950/50 text-rose-400 px-2 py-0.5 rounded-md border border-rose-900/40">
                        {job.attempts}/{job.maxAttempts || 3} lần thử
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        ID: {job.id?.slice(0, 8)}...
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium truncate">
                      Tiêu đề: <span className="text-amber-400/90">{job.subject || '(Không có tiêu đề)'}</span>
                    </div>

                    {job.lastError && (
                      <div className="text-xs text-rose-400/90 bg-rose-950/30 border border-rose-900/30 rounded-lg p-2 flex items-start gap-1.5">
                        <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                        <span className="break-all font-mono text-[11px]">{job.lastError}</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      Thời điểm tạo: {job.createdAt ? new Date(job.createdAt).toLocaleString('vi-VN') : 'Không xác định'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleRetry(job.id)}
                      disabled={retryingJobId === job.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={retryingJobId === job.id ? 'animate-spin' : ''} />
                      {retryingJobId === job.id ? 'Đang gửi lại...' : 'Thử lại'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {dlqJobs.length > 0 && (
          <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Tổng cộng: <strong className="text-rose-400">{dlqJobs.length}</strong> thư lỗi
            </span>
            <button
              type="button"
              onClick={onClearDlq}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-semibold transition-all"
            >
              <Trash2 size={14} />
              Dọn sạch toàn bộ DLQ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

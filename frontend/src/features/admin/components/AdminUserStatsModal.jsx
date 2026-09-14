import React from 'react';
import { Users, X } from 'lucide-react';

export default function AdminUserStatsModal({ isOpen, userStats, onClose }) {
  if (!isOpen || !userStats) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[85vh] p-6 relative shadow-2xl flex flex-col space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-serif font-bold text-amber-500 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Users size={24} />
          Chi Tiết Thành Viên & Thống Kê
        </h3>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
              <span className="block text-xs font-bold text-slate-450 uppercase mb-1">Tên hiển thị</span>
              <span className="font-semibold text-slate-200">{userStats.user.name}</span>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
              <span className="block text-xs font-bold text-slate-450 uppercase mb-1">Email</span>
              <span className="font-semibold text-slate-200 truncate block">{userStats.user.email}</span>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
              <span className="block text-xs font-bold text-slate-450 uppercase mb-1">Vai trò</span>
              <span className="capitalize font-semibold text-slate-200">{userStats.user.role}</span>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
              <span className="block text-xs font-bold text-slate-450 uppercase mb-1">Số Credit hiện tại</span>
              <span className="font-semibold text-amber-500">{userStats.user.credits}</span>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
              <span className="block text-xs font-bold text-slate-450 uppercase mb-1">Trạng thái</span>
              <span className="font-semibold">
                {userStats.user.isDeleted ? (
                  <span className="text-red-500 bg-red-950/30 px-2 py-0.5 rounded-md border border-red-900/50">Đã xóa</span>
                ) : userStats.user.status === 'locked' ? (
                  <span className="text-amber-500 bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-900/50">Bị khóa</span>
                ) : (
                  <span className="text-emerald-500 bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-900/50">Hoạt động</span>
                )}
              </span>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
              <span className="block text-xs font-bold text-slate-450 uppercase mb-1">Ngày tham gia</span>
              <span className="font-semibold text-slate-200">
                {new Date(userStats.user.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            {userStats.user.status === 'locked' && (
              <>
                <div className="bg-red-950/20 p-3.5 rounded-xl border border-red-900/30 col-span-2">
                  <span className="block text-xs font-bold text-red-400 uppercase mb-1">Lý do khóa tài khoản</span>
                  <span className="font-semibold text-slate-250">{userStats.user.lockReason || 'Không có lý do'}</span>
                </div>
                <div className="bg-red-950/20 p-3.5 rounded-xl border border-red-900/30 col-span-2">
                  <span className="block text-xs font-bold text-red-400 uppercase mb-1">Thời điểm bị khóa</span>
                  <span className="font-semibold text-slate-250">
                    {new Date(userStats.user.updatedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thống kê sử dụng</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-1">Kinh Dịch</span>
                  <div className="text-sm font-bold text-slate-200 mb-1">{userStats.stats.ichingCount} <span className="text-[10px] text-slate-400 font-normal">lần</span></div>
                </div>
                <div className="space-y-0.5 border-t border-slate-850 pt-1 text-[10px] text-slate-450 font-mono text-left">
                  <div>Dịch lý: {(userStats.stats.ichingTokens || 0).toLocaleString()}</div>
                  <div>Chat: {(userStats.stats.ichingChatTokens || 0).toLocaleString()}</div>
                  <div className="text-amber-500 font-bold border-t border-slate-850/60 pt-0.5 mt-0.5">Tổng: {((userStats.stats.ichingTokens || 0) + (userStats.stats.ichingChatTokens || 0)).toLocaleString()}</div>
                </div>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-1">Bát Tự</span>
                  <div className="text-sm font-bold text-slate-200 mb-1">{userStats.stats.baziCount} <span className="text-[10px] text-slate-400 font-normal">lần</span></div>
                </div>
                <div className="space-y-0.5 border-t border-slate-850 pt-1 text-[10px] text-slate-450 font-mono text-left">
                  <div>Dịch lý: {(userStats.stats.baziTokens || 0).toLocaleString()}</div>
                  <div>Chat: {(userStats.stats.baziChatTokens || 0).toLocaleString()}</div>
                  <div className="text-amber-500 font-bold border-t border-slate-850/60 pt-0.5 mt-0.5">Tổng: {((userStats.stats.baziTokens || 0) + (userStats.stats.baziChatTokens || 0)).toLocaleString()}</div>
                </div>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-1">Tử Vi</span>
                  <div className="text-sm font-bold text-slate-200 mb-1">{userStats.stats.ziweiCount} <span className="text-[10px] text-slate-400 font-normal">lần</span></div>
                </div>
                <div className="space-y-0.5 border-t border-slate-850 pt-1 text-[10px] text-slate-450 font-mono text-left">
                  <div>Dịch lý: {(userStats.stats.ziweiTokens || 0).toLocaleString()}</div>
                  <div>Chat: {(userStats.stats.ziweiChatTokens || 0).toLocaleString()}</div>
                  <div className="text-amber-500 font-bold border-t border-slate-850/60 pt-0.5 mt-0.5">Tổng: {((userStats.stats.ziweiTokens || 0) + (userStats.stats.ziweiChatTokens || 0)).toLocaleString()}</div>
                </div>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-1">Hợp Hôn</span>
                  <div className="text-sm font-bold text-slate-200 mb-1">{userStats.stats.marriageCount || 0} <span className="text-[10px] text-slate-400 font-normal">lần</span></div>
                </div>
                <div className="space-y-0.5 border-t border-slate-850 pt-1 text-[10px] text-slate-450 font-mono text-left">
                  <div>Dịch lý: {(userStats.stats.marriageTokens || 0).toLocaleString()}</div>
                  <div>Chat: {(userStats.stats.marriageChatTokens || 0).toLocaleString()}</div>
                  <div className="text-amber-500 font-bold border-t border-slate-850/60 pt-0.5 mt-0.5">Tổng: {((userStats.stats.marriageTokens || 0) + (userStats.stats.marriageChatTokens || 0)).toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Tổng Token Luận Giải AI:</span>
                <span className="text-slate-250 font-mono font-bold">{(userStats.stats.totalInterpretTokens || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Tổng Token Trò Chuyện Chat AI:</span>
                <span className="text-slate-250 font-mono font-bold">{(userStats.stats.totalChatTokens || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold border-t border-slate-850 pt-2 text-amber-500">
                <span>TỔNG CỘNG TOÀN BỘ TOKEN (Luận Giải + Chat):</span>
                <span className="font-mono text-base">{(userStats.stats.totalTokens || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl transition-colors text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import {
  Server,
  Database,
  Cpu,
  Mail,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Layers,
  Activity
} from 'lucide-react';
import { useAdminTheme } from '@/features/admin/context/AdminThemeContext';

export default function AdminSystemHealthCard({
  health,
  queueStatus,
  loading,
  onRefresh,
  onOpenDlqModal,
  onOpenDetailModal
}) {
  const { isLight } = useAdminTheme();
  const isDbHealthy = health?.database?.status === 'connected';
  const isRedisHealthy = health?.redis?.status === 'connected';
  const dlqCount = queueStatus?.dlq || health?.queue?.dlq || 0;
  const activeQueueCount = queueStatus?.active || health?.queue?.active || 0;

  return (
    <div className={`border rounded-3xl p-5 sm:p-6 space-y-4 transition-colors ${
      isLight
        ? 'bg-white border-slate-200/90 shadow-sm text-slate-850'
        : 'bg-slate-950/40 border-slate-800 shadow-xl text-slate-100'
    }`}>
      {/* Card Header */}
      <div className={`flex items-center justify-between border-b pb-3 flex-wrap gap-2 ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${
            isLight
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-blue-950/40 text-blue-400 border-blue-800/40'
          }`}>
            <Server size={20} />
          </div>
          <div>
            <h3 className={`text-base sm:text-lg font-serif font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              Giám Sát Hạ Tầng & Hàng Đợi (DevOps)
              <span className={`text-[11px] font-sans px-2 py-0.5 rounded-full border ${
                health?.status === 'healthy'
                  ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50')
                  : (isLight ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold' : 'bg-amber-950/40 text-amber-400 border-amber-800/50')
              }`}>
                {health?.status === 'healthy' ? 'Hoạt động tốt' : 'Cảnh báo'}
              </span>
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Chỉ số độ trễ mạng thực tế, bộ nhớ RAM máy chủ và hàng đợi email bất đồng bộ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDetailModal && (
            <button
              type="button"
              onClick={onOpenDetailModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm border ${
                isLight
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 font-bold'
                  : 'bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border-blue-800/60 hover:border-blue-600'
              }`}
              title="Mở bảng chỉ số chi tiết sức khỏe và trạng thái hệ thống"
            >
              <Activity size={14} className={isLight ? 'text-blue-600' : 'text-blue-400'} />
              <span>Xem chi tiết</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
            }`}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-amber-500' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. MongoDB Metrics */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-colors ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              <Database size={15} className="text-emerald-500" />
              MongoDB Database
            </span>
            <span className={`flex h-2.5 w-2.5 rounded-full ${isDbHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {health?.database?.latencyMs != null && health.database.latencyMs >= 0 ? `${health.database.latencyMs}` : '--'}
              </span>
              <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>ms độ trễ</span>
            </div>
            <p className={`text-[11px] truncate mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              DB: {health?.database?.name || 'phongthuy'}
            </p>
          </div>
        </div>

        {/* 2. Redis Metrics */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-colors ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              <Layers size={15} className="text-rose-500" />
              Redis L2 Cache
            </span>
            <span className={`flex h-2.5 w-2.5 rounded-full ${isRedisHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {health?.redis?.latencyMs != null && health.redis.latencyMs >= 0 ? `${health.redis.latencyMs}` : '--'}
              </span>
              <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>ms ping</span>
            </div>
            <p className={`text-[11px] truncate mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Chế độ: {isRedisHealthy ? 'Redis TCP (L2)' : 'RAM Local (L1 Fallback)'}
            </p>
          </div>
        </div>

        {/* 3. Server Memory (RAM) */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-colors ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              <Cpu size={15} className="text-cyan-500" />
              Bộ Nhớ (RAM)
            </span>
            <span className={`text-[11px] ${isLight ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
              Uptime: {health?.uptimeSeconds ? `${Math.floor(health.uptimeSeconds / 3600)}h` : '--'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {health?.memory?.rss || '--'}
              </span>
              <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>RSS Usage</span>
            </div>
            <p className={`text-[11px] truncate mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Heap: {health?.memory?.heapUsed || '--'} / {health?.memory?.heapTotal || '--'}
            </p>
          </div>
        </div>

        {/* 4. Email Queue & DLQ */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-colors ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              <Mail size={15} className="text-amber-500" />
              Hàng Đợi Email
            </span>
            {dlqCount > 0 ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border animate-pulse ${
                isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
              }`}>
                {dlqCount} lỗi
              </span>
            ) : (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
              }`}>
                Trống
              </span>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className={`text-2xl font-extrabold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {activeQueueCount}
                </span>
                <span className={`text-xs font-medium ml-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>đang xử lý</span>
              </div>
              <button
                type="button"
                onClick={onOpenDlqModal}
                className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  dlqCount > 0
                    ? (isLight ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300' : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40')
                    : (isLight ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700 border border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700')
                }`}
              >
                <span>Quản lý DLQ</span>
                <ExternalLink size={12} />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Thư lỗi (DLQ): <strong className={dlqCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>{dlqCount}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

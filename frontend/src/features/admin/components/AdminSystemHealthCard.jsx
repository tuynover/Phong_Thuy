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
  Layers
} from 'lucide-react';

export default function AdminSystemHealthCard({
  health,
  queueStatus,
  loading,
  onRefresh,
  onOpenDlqModal
}) {
  const isDbHealthy = health?.database?.status === 'connected';
  const isRedisHealthy = health?.redis?.status === 'connected';
  const dlqCount = queueStatus?.dlq || health?.queue?.dlq || 0;
  const activeQueueCount = queueStatus?.active || health?.queue?.active || 0;

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-950/40 text-blue-400 rounded-xl border border-blue-800/40">
            <Server size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-slate-100 flex items-center gap-2">
              Giám Sát Hạ Tầng & Hàng Đợi (DevOps)
              <span className={`text-[11px] font-sans px-2 py-0.5 rounded-full border ${
                health?.status === 'healthy'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                  : 'bg-amber-950/40 text-amber-400 border-amber-800/50'
              }`}>
                {health?.status === 'healthy' ? 'Hoạt động tốt' : 'Cảnh báo'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Chỉ số độ trễ mạng thực tế, bộ nhớ RAM máy chủ và hàng đợi email bất đồng bộ.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-amber-500' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 4 Metric Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. MongoDB Metrics */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Database size={15} className="text-emerald-400" />
              MongoDB Database
            </span>
            <span className={`flex h-2.5 w-2.5 rounded-full ${isDbHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-100 font-serif">
                {health?.database?.latencyMs != null && health.database.latencyMs >= 0 ? `${health.database.latencyMs}` : '--'}
              </span>
              <span className="text-xs text-slate-400 font-medium">ms độ trễ</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-1">
              DB: {health?.database?.name || 'phongthuy'}
            </p>
          </div>
        </div>

        {/* 2. Redis Metrics */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={15} className="text-rose-400" />
              Redis L2 Cache
            </span>
            <span className={`flex h-2.5 w-2.5 rounded-full ${isRedisHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-100 font-serif">
                {health?.redis?.latencyMs != null && health.redis.latencyMs >= 0 ? `${health.redis.latencyMs}` : '--'}
              </span>
              <span className="text-xs text-slate-400 font-medium">ms ping</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-1">
              Chế độ: {isRedisHealthy ? 'Redis TCP (L2)' : 'RAM Local (L1 Fallback)'}
            </p>
          </div>
        </div>

        {/* 3. Server Memory (RAM) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={15} className="text-cyan-400" />
              Bộ Nhớ (RAM)
            </span>
            <span className="text-[11px] text-slate-400">
              Uptime: {health?.uptimeSeconds ? `${Math.floor(health.uptimeSeconds / 3600)}h` : '--'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-100 font-serif">
                {health?.memory?.rss || '--'}
              </span>
              <span className="text-xs text-slate-400 font-medium">RSS Usage</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-1">
              Heap: {health?.memory?.heapUsed || '--'} / {health?.memory?.heapTotal || '--'}
            </p>
          </div>
        </div>

        {/* 4. Email Queue & DLQ */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={15} className="text-amber-400" />
              Hàng Đợi Email
            </span>
            {dlqCount > 0 ? (
              <span className="text-[10px] bg-rose-950/60 text-rose-400 font-bold px-1.5 py-0.5 rounded border border-rose-800/60 animate-pulse">
                {dlqCount} lỗi
              </span>
            ) : (
              <span className="text-[10px] bg-emerald-950/40 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-800/40">
                Trống
              </span>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-extrabold text-slate-100 font-serif">
                  {activeQueueCount}
                </span>
                <span className="text-xs text-slate-400 font-medium ml-1.5">đang xử lý</span>
              </div>
              <button
                type="button"
                onClick={onOpenDlqModal}
                className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  dlqCount > 0
                    ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
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

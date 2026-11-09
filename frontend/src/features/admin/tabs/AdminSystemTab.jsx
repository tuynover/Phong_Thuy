import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSystemHealthDetailed, pruneDockerStorage } from '@/services/api';
import {
  Server,
  Cpu,
  HardDrive,
  Database,
  Activity,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  Zap,
  CheckCircle2,
  Layers,
  Bot,
  Mail,
  Network,
  PieChart as PieIcon,
  Flame,
  Gauge,
  Trash2,
  Box,
  Container,
  Terminal,
  Sparkles,
  Check,
  Globe,
  Info
} from 'lucide-react';
import { useAdminTheme } from '@/features/admin/context/AdminThemeContext';

export default function AdminSystemTab() {
  const { isLight } = useAdminTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Mặc định tự động ping mỗi 15 phút (900 giây) theo yêu cầu, không ping vài chục giây
  const [autoRefreshSec, setAutoRefreshSec] = useState(900);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchMetrics = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await getSystemHealthDetailed();
      setData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Lỗi khi tải thông số sức khỏe hệ thống:', err);
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh timer (Mỗi 15 phút, hoặc 30p, hoặc tắt)
  useEffect(() => {
    if (autoRefreshSec <= 0) return;
    const interval = setInterval(() => {
      fetchMetrics(false);
    }, autoRefreshSec * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshSec, fetchMetrics]);

  // Xử lý dọn dẹp Docker Images không dùng (Prune)
  const handlePruneDocker = async () => {
    if (isPruning) return;
    setIsPruning(true);
    try {
      const res = await pruneDockerStorage();
      setToastMessage(res.data?.message || 'Đã dọn dẹp Docker Images thành công!');
      await fetchMetrics(false);
    } catch (err) {
      console.error('Lỗi dọn dẹp Docker:', err);
      setToastMessage(err.response?.data?.error || err.response?.data?.message || 'Có lỗi xảy ra khi dọn dẹp tài nguyên.');
    } finally {
      setIsPruning(false);
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return '0 phút';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d} ngày`);
    if (h > 0) parts.push(`${h} giờ`);
    if (m > 0 || parts.length === 0) parts.push(`${m} phút`);
    if (d === 0 && h === 0 && m < 5) parts.push(`${s} giây`);
    return parts.join(' ');
  };

  const isHealthy = data?.status === 'healthy';
  const mongoLatency = data?.database?.latencyMs ?? null;
  const cpu = data?.cpu || {};
  const ram = data?.ram || {};
  const disk = data?.disk || {};
  const vps = data?.vpsOverview || {};
  const docker = data?.docker || {};
  const isDockerActive = docker.available && docker.isDockerRunning;
  const services = useMemo(() => data?.servicesBreakdown || [], [data?.servicesBreakdown]);

  // Service color palette
  const serviceColorMap = {
    backend: { bar: 'bg-blue-500', text: 'text-blue-500', lightBg: 'bg-blue-50', badge: 'border-blue-200 text-blue-700 bg-blue-50' },
    mongodb: { bar: 'bg-amber-500', text: 'text-amber-500', lightBg: 'bg-amber-50', badge: 'border-amber-200 text-amber-700 bg-amber-50' },
    redis: { bar: 'bg-emerald-500', text: 'text-emerald-500', lightBg: 'bg-emerald-50', badge: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
    queue: { bar: 'bg-purple-500', text: 'text-purple-500', lightBg: 'bg-purple-50', badge: 'border-purple-200 text-purple-700 bg-purple-50' },
    ai_rotator: { bar: 'bg-indigo-500', text: 'text-indigo-500', lightBg: 'bg-indigo-50', badge: 'border-indigo-200 text-indigo-700 bg-indigo-50' },
    os_system: { bar: 'bg-slate-400', text: 'text-slate-500', lightBg: 'bg-slate-100', badge: 'border-slate-200 text-slate-700 bg-slate-50' }
  };

  const getServiceIcon = (key) => {
    switch (key) {
      case 'backend': return <Network size={18} className="text-blue-500 shrink-0" />;
      case 'mongodb': return <Database size={18} className="text-amber-500 shrink-0" />;
      case 'redis': return <Zap size={18} className="text-emerald-500 shrink-0" />;
      case 'queue': return <Mail size={18} className="text-purple-500 shrink-0" />;
      case 'ai_rotator': return <Bot size={18} className="text-indigo-500 shrink-0" />;
      default: return <Server size={18} className="text-slate-500 shrink-0" />;
    }
  };

  if (loading && !data) {
    return (
      <div className={`p-12 rounded-3xl border flex flex-col items-center justify-center space-y-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <RefreshCw size={32} className="animate-spin text-amber-500" />
        <p className={`text-sm font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          Đang kết nối và thu thập số liệu phần cứng thực tế từ máy chủ VPS...
        </p>
      </div>
    );
  }

  const freeRamPercent = Number((((ram.freeMb || 0) / (ram.totalMb || 1)) * 100).toFixed(1));
  const activeRamServices = services.filter((s) => (s.ramPercent || 0) > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* TOAST NOTIFICATION THẬT */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200 max-w-md">
          <div className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
            isLight
              ? 'bg-white text-slate-850 border-slate-200 shadow-slate-900/10'
              : 'bg-slate-900 text-slate-100 border-slate-700 shadow-black/40'
          }`}>
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
              <Info size={13} strokeWidth={2.5} />
            </span>
            <span className="leading-relaxed">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          TOP ACTION BAR: TIÊU ĐỀ & ĐIỀU KHIỂN CHU KỲ PING 15 PHÚT
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className={`text-xl sm:text-2xl font-bold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Hạ Tầng Máy Chủ VPS & Trạng Thái Dịch Vụ
            </h3>
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wide ${
              isHealthy
                ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')
                : (isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-rose-500/20 text-rose-400 border-rose-500/30')
            }`}>
              {isHealthy ? '100% Sẵn Sàng (Healthy)' : 'Đang Suy Giảm'}
            </span>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Số liệu đo lường thực tế từ phần cứng OS. Tự động cập nhật mỗi 15 phút hoặc khi bấm "Làm Mới".
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Tần suất tự động làm mới: 15 phút theo yêu cầu */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
            isLight ? 'bg-white border-slate-200/90 text-slate-700 shadow-2xs' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <Clock size={13} className="text-amber-500" />
            <span className="text-[11px] font-medium opacity-80">Chu kỳ ping:</span>
            <select
              value={autoRefreshSec}
              onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
              className={`bg-transparent font-bold outline-none cursor-pointer text-xs ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              <option value={900} className="bg-slate-900 text-white">15 phút (Chuẩn)</option>
              <option value={1800} className="bg-slate-900 text-white">30 phút</option>
              <option value={3600} className="bg-slate-900 text-white">1 giờ</option>
              <option value={0} className="bg-slate-900 text-white">Tắt (Chỉ bấm thủ công)</option>
            </select>
          </div>

          {/* Nút Làm Mới Thủ Công */}
          <button
            type="button"
            onClick={() => fetchMetrics(true)}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95 border ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/80 hover:border-amber-300'
                : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-800/60'
            }`}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-amber-500' : 'text-amber-500'} />
            <span>{isRefreshing ? 'Đang ping...' : 'Làm Mới'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          YÊU CẦU 1: HIỂN THỊ TỔNG QUAN TRÊN MÁY CHỦ VPS (HARDWARE KPI)
          ======================================================== */}
      <div className={`p-5 sm:p-6 rounded-3xl border space-y-4 transition-all ${
        isLight
          ? 'bg-gradient-to-br from-white via-slate-50/60 to-amber-50/20 border-slate-200/90 shadow-sm text-slate-850'
          : 'bg-gradient-to-br from-slate-950/60 via-slate-900/40 to-amber-950/10 border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200/70 dark:border-slate-800/70">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isLight ? 'bg-amber-100/70 border-amber-300/80 text-amber-700' : 'bg-amber-950/60 border-amber-800 text-amber-400'
            }`}>
              <Server size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={`text-base font-bold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Hạ Tầng Máy Chủ VPS Chính
                </h4>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}>
                  {vps.osType || 'Linux'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Hostname: <strong className="font-semibold">{vps.hostname || 'vps-host'}</strong> • Kiến trúc: {vps.arch || 'x64'} • Uptime: {formatUptime(vps.uptimeSeconds)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 ${
              isLight ? 'bg-white border-slate-200 text-slate-800 shadow-2xs' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <Globe size={13} className="text-blue-500" />
              <span>IP Gateway: Active</span>
            </span>
            <span className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 ${
              isLight ? 'bg-white border-slate-200 text-slate-800 shadow-2xs' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <Activity size={13} className="text-amber-500" />
              <span>Độ trễ API: {mongoLatency !== null ? (mongoLatency >= 0 ? `${mongoLatency}ms` : 'Mất kết nối') : '< 1ms'}</span>
            </span>
          </div>
        </div>

        {/* 4 Cột chỉ số % sử dụng & dung lượng còn trống */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {/* 1. Mức Dùng CPU */}
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white/80 border-slate-200/70 shadow-2xs' : 'bg-slate-950/40 border-slate-800/80'
          }`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isLight ? 'text-slate-400' : 'text-slate-400'
            }`}>
              Mức Dùng CPU
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-2xl font-bold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {cpu.systemCpuPercent ?? 0}%
              </span>
              <span className="text-[11px] font-semibold text-amber-600">
                {cpu.cores || 1} Cores
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2 shadow-2xs">
              <div
                className={`h-full transition-all duration-500 ${
                  (cpu.systemCpuPercent || 0) > 85 ? 'bg-rose-500' : ((cpu.systemCpuPercent || 0) > 60 ? 'bg-amber-500' : 'bg-amber-600')
                }`}
                style={{ width: `${Math.min(100, Math.max(3, cpu.systemCpuPercent || 0))}%` }}
              />
            </div>
            <p className={`text-[11px] mt-2 flex items-center justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Còn rỗi: <strong className="text-emerald-600 font-semibold">{Math.max(0, 100 - (cpu.systemCpuPercent ?? 0))}%</strong></span>
            </p>
          </div>

          {/* 2. Mức Dùng Bộ Nhớ RAM */}
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white/80 border-slate-200/70 shadow-2xs' : 'bg-slate-950/40 border-slate-800/80'
          }`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isLight ? 'text-slate-400' : 'text-slate-400'
            }`}>
              Mức Dùng Bộ Nhớ RAM
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-2xl font-bold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {ram.percentUsed ?? 0}%
              </span>
              <span className={`text-[11px] font-semibold ${
                ram.percentUsed > 85 ? 'text-rose-500' : 'text-blue-600'
              }`}>
                Dùng {((ram.usedMb || 0) / 1024).toFixed(1)} GB
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2 shadow-2xs">
              <div
                className={`h-full transition-all duration-500 ${
                  (ram.percentUsed || 0) > 85 ? 'bg-rose-500' : ((ram.percentUsed || 0) > 70 ? 'bg-blue-600' : 'bg-blue-500')
                }`}
                style={{ width: `${Math.min(100, Math.max(3, ram.percentUsed || 0))}%` }}
              />
            </div>
            <p className={`text-[11px] mt-2 flex items-center justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Còn trống: <strong className="text-emerald-600 font-semibold">{((ram.freeMb || 0) / 1024).toFixed(1)} GB</strong></span>
            </p>
          </div>

          {/* 3. Mức Dùng Ổ Đĩa (Disk) */}
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white/80 border-slate-200/70 shadow-2xs' : 'bg-slate-950/40 border-slate-800/80'
          }`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isLight ? 'text-slate-400' : 'text-slate-400'
            }`}>
              Mức Dùng Ổ Đĩa (Disk)
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-2xl font-bold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {disk.percentUsed !== undefined ? `${disk.percentUsed}%` : 'Đang đo'}
              </span>
              {disk.usedGb ? (
                <span className={`text-[11px] font-semibold ${
                  disk.percentUsed > 85 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'
                }`}>
                  Dùng {disk.usedGb} GB
                </span>
              ) : null}
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2 shadow-2xs">
              <div
                className={`h-full transition-all duration-500 ${
                  (disk.percentUsed || 0) > 85 ? 'bg-rose-500' : ((disk.percentUsed || 0) > 70 ? 'bg-emerald-600' : 'bg-emerald-500')
                }`}
                style={{ width: `${Math.min(100, Math.max(3, disk.percentUsed || 0))}%` }}
              />
            </div>
            <p className={`text-[11px] mt-2 flex items-center justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {disk.freeGb ? (
                <span>Còn trống: <strong className="text-emerald-600 font-semibold">{disk.freeGb} GB</strong></span>
              ) : (
                <span>Đang kiểm tra ổ đĩa...</span>
              )}
            </p>
          </div>

          {/* 4. Tải Hệ Thống (Load Average) */}
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white/80 border-slate-200/70 shadow-2xs' : 'bg-slate-950/40 border-slate-800/80'
          }`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isLight ? 'text-slate-400' : 'text-slate-400'
            }`}>
              Tải Trung Bình (Load Avg)
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-xl font-bold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {cpu.loadAvg?.[0] ?? '0.00'}
              </span>
              <span className="text-[10px] opacity-70">1m, 5m, 15m</span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2 shadow-2xs">
              <div
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(3, (cpu.loadAvg?.[0] || 0) * 25))}%` }}
              />
            </div>
            <p className={`text-[11px] mt-2 font-mono flex items-center justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>{cpu.loadAvg?.join(' • ') || '0.00 • 0.00 • 0.00'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          YÊU CẦU 2: TÀI NGUYÊN LƯU TRỮ DOCKER (CHỈ HIỂN THỊ SỐ THẬT, KHÔNG DÙNG SỐ ẢO)
          ======================================================== */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm text-slate-850'
          : 'bg-slate-950/40 border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200/70 dark:border-slate-800/70">
          <div>
            <div className="flex items-center gap-2">
              <Container size={20} className="text-blue-500" />
              <h4 className={`text-base font-bold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Tài Nguyên Lưu Trữ Container & Docker Images
              </h4>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                isDockerActive
                  ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800')
                  : (isLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-800')
              }`}>
                {isDockerActive ? 'Docker Daemon Đang Chạy' : 'Chưa Kích Hoạt Docker (Chờ Production)'}
              </span>
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isDockerActive
                ? 'Dữ liệu đo lường trực tiếp từ Docker Daemon qua lệnh hệ thống docker system df.'
                : 'Hệ thống đang chạy trực tiếp trên môi trường máy chủ. Dữ liệu Docker sẽ tự động nạp khi triển khai lên Production VPS.'}
            </p>
          </div>

          {/* Nút Dọn Dẹp Images Không Sử Dụng (Prune) */}
          <button
            type="button"
            onClick={handlePruneDocker}
            disabled={isPruning}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 border ${
              isDockerActive
                ? (isLight
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/90 hover:border-rose-300'
                    : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border-rose-800/60')
                : (isLight
                    ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800')
            }`}
            title={isDockerActive ? 'Quét và dọn dẹp các Docker images rác không dùng để giải phóng ổ đĩa' : 'Kiểm tra và dọn dẹp tài nguyên máy chủ'}
          >
            <Trash2 size={14} className={isPruning ? 'animate-spin text-rose-500' : (isDockerActive ? 'text-rose-500' : 'text-slate-400')} />
            <span>
              {isPruning
                ? 'Đang dọn dẹp...'
                : (isDockerActive
                    ? `Dọn dẹp Images không sử dụng (Thu hồi ${docker.imagesReclaimableMb || 0} MB)`
                    : 'Dọn dẹp Docker (Chỉ khả dụng trên Production VPS)')}
            </span>
          </button>
        </div>

        {/* Thông báo giải thích rõ ràng nếu môi trường Local chưa có Docker */}
        {!isDockerActive && (
          <div className={`mt-4 p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
            isLight
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-amber-950/30 border-amber-900/50 text-amber-300'
          }`}>
            <Info size={16} className="shrink-0 text-amber-600" />
            <span>
              <strong>Ghi chú giám sát:</strong> Môi trường hiện tại đang chạy Node.js trực tiếp trên OS (Non-Docker). Các thông số Docker Images, Layer Container và Volumes dưới đây sẽ tự động hiển thị số liệu thật khi triển khai lên Production VPS Linux thông qua socket <code>/var/run/docker.sock</code>.
            </span>
          </div>
        )}

        {/* 4 Thẻ chỉ số Docker Storage (100% Số Thật) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {/* Images */}
          <div className={`p-3.5 rounded-2xl border ${
            isLight ? 'bg-slate-50/80 border-slate-200/70' : 'bg-slate-900/50 border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Docker Images
              </span>
              <Box size={14} className="text-blue-500" />
            </div>
            <span className={`text-xl font-bold font-serif block mt-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {isDockerActive && docker.imagesSizeGb !== null ? `${docker.imagesSizeGb} GB` : '--'}
            </span>
            <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isDockerActive && docker.imagesCount !== null ? (
                <>{docker.imagesCount} images • Rác: <strong className="text-rose-500">{docker.imagesReclaimableMb || 0} MB</strong></>
              ) : (
                'Chờ Production'
              )}
            </span>
          </div>

          {/* Containers */}
          <div className={`p-3.5 rounded-2xl border ${
            isLight ? 'bg-slate-50/80 border-slate-200/70' : 'bg-slate-900/50 border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Containers Layer
              </span>
              <Container size={14} className="text-emerald-500" />
            </div>
            <span className={`text-xl font-bold font-serif block mt-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {isDockerActive && docker.containersSizeMb !== null ? `${docker.containersSizeMb} MB` : '--'}
            </span>
            <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isDockerActive && docker.containersRunning !== null ? (
                <>{docker.containersRunning} containers đang chạy</>
              ) : (
                'Chờ Production'
              )}
            </span>
          </div>

          {/* Volumes */}
          <div className={`p-3.5 rounded-2xl border ${
            isLight ? 'bg-slate-50/80 border-slate-200/70' : 'bg-slate-900/50 border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Volumes Dữ Liệu
              </span>
              <Database size={14} className="text-amber-500" />
            </div>
            <span className={`text-xl font-bold font-serif block mt-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {isDockerActive && docker.volumesSizeMb !== null ? `${docker.volumesSizeMb} MB` : '--'}
            </span>
            <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isDockerActive && docker.volumesCount !== null ? (
                <>{docker.volumesCount} volumes bền vững</>
              ) : (
                'Chờ Production'
              )}
            </span>
          </div>

          {/* Build Cache */}
          <div className={`p-3.5 rounded-2xl border ${
            isLight ? 'bg-slate-50/80 border-slate-200/70' : 'bg-slate-900/50 border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Build & Tệp Tạm
              </span>
              <Sparkles size={14} className="text-purple-500" />
            </div>
            <span className={`text-xl font-bold font-serif block mt-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {isDockerActive && docker.buildCacheMb !== null ? `${docker.buildCacheMb} MB` : '--'}
            </span>
            <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isDockerActive && docker.totalReclaimableMb !== null ? (
                <>Thu hồi được: <strong className="text-emerald-600">{docker.totalReclaimableMb} MB</strong></>
              ) : (
                'Chờ Production'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          PHÂN BỔ BỘ NHỚ RAM ĐA TẦNG (CHỈ TẬP HỢP TIẾN TRÌNH THỰC SỰ CÓ BỘ NHỚ)
          ======================================================== */}
      <div className={`p-5 sm:p-6 rounded-3xl border space-y-4 transition-all ${
        isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-950/40 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              <PieIcon size={17} className="text-amber-500" />
              Bóc Tách Phân Bổ Bộ Nhớ RAM Thực Tế
            </h4>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Tỷ lệ phần trăm chiếm dụng RAM thực của các tiến trình so với tổng dung lượng máy chủ ({((ram.totalMb || 0) / 1024).toFixed(1)} GB)
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-xl self-start sm:self-auto border ${
            ram.percentUsed > 85
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : (isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-950 text-blue-300 border-blue-800')
          }`}>
            Đã dùng {ram.percentUsed ?? 0}% ({((ram.usedMb || 0) / 1024).toFixed(1)} GB)
          </span>
        </div>

        {/* Thanh Multi-Segment Stacked Progress Bar */}
        <div className="w-full h-4 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex shadow-inner">
          {activeRamServices.map((svc) => {
            const colors = serviceColorMap[svc.key] || serviceColorMap.os_system;
            const pct = svc.ramPercent || 0;
            if (pct <= 0) return null;
            return (
              <div
                key={svc.key}
                className={`${colors.bar} h-full transition-all duration-500 hover:opacity-85 cursor-pointer`}
                style={{ width: `${pct}%` }}
                title={`${svc.name}: ${svc.ramMb >= 1024 ? `${(svc.ramMb / 1024).toFixed(2)}GB` : `${svc.ramMb}MB`} (${pct}%)`}
              />
            );
          })}
          {/* Free RAM Segment */}
          {freeRamPercent > 0 && (
            <div
              className="bg-emerald-400/40 h-full transition-all duration-500 hover:opacity-85"
              style={{ width: `${freeRamPercent}%` }}
              title={`RAM Khả dụng: ${((ram.freeMb || 0) / 1024).toFixed(1)}GB (${freeRamPercent}%)`}
            />
          )}
        </div>

        {/* Chú thích các thành phần RAM Thực Tế */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs">
          {activeRamServices.map((svc) => {
            const colors = serviceColorMap[svc.key] || serviceColorMap.os_system;
            return (
              <div key={svc.key} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${colors.bar} shrink-0`} />
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  {svc.key === 'backend' ? 'API Gateway & Backend' : (svc.key === 'mongodb' ? 'MongoDB' : (svc.key === 'redis' ? 'Redis L2' : 'Host OS & Hệ Thống'))}:
                </span>
                <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>
                  {svc.ramMb >= 1024 ? `${(svc.ramMb / 1024).toFixed(2)}GB` : `${svc.ramMb}MB`} ({svc.ramPercent}%)
                </strong>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90 shrink-0" />
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Khả dụng (Free):</span>
            <strong className="text-emerald-600 font-bold">
              {((ram.freeMb || 0) / 1024).toFixed(1)}GB ({freeRamPercent}%)
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================
          BẢNG BÓC TÁCH CHI TIẾT TỪNG SERVICE (CHỈ HIỂN THỊ DỮ LIỆU THẬT)
          ======================================================== */}
      <div className={`border rounded-3xl overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-950/40 border-slate-800'
      }`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200/80 bg-slate-50/70' : 'border-slate-800 bg-slate-900/40'
        }`}>
          <div>
            <h4 className={`text-base font-bold font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Bảng Chỉ Số Dịch Vụ Nền Tảng & Mức Tiêu Thụ Tài Nguyên
            </h4>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Thông số CPU đang sử dụng, RAM lẻ từng thành phần và chi tiết trạng thái hoạt động thực tế
            </p>
          </div>
          {lastUpdated && (
            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[11px] font-extrabold uppercase tracking-wider ${
                isLight ? 'bg-slate-50 text-slate-500 border-slate-200/90' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                <th className="py-3.5 px-6">Dịch Vụ & Khung Chạy</th>
                <th className="py-3.5 px-5 text-center">Tải CPU (%)</th>
                <th className="py-3.5 px-5 text-center">RAM Lẻ (Thực Tế)</th>
                <th className="py-3.5 px-5 text-center">% Chiếm Dụng RAM Tổng</th>
                <th className="py-3.5 px-6">Trạng Thái & Chi Tiết Kỹ Thuật</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200/70' : 'divide-slate-800/60'}`}>
              {services.map((svc) => {
                const colors = serviceColorMap[svc.key] || serviceColorMap.os_system;
                return (
                  <tr key={svc.key} className={isLight ? 'hover:bg-slate-50/70 transition-colors' : 'hover:bg-slate-900/30 transition-colors'}>
                    
                    {/* Dịch vụ & Công nghệ */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isLight ? `${colors.lightBg} border-slate-200/80` : 'bg-slate-900 border-slate-800'
                        }`}>
                          {getServiceIcon(svc.key)}
                        </span>
                        <div>
                          <span className={`font-bold text-xs block ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                            {svc.name}
                          </span>
                          <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            <strong className="font-semibold text-slate-700 dark:text-slate-300">{svc.tech}</strong> • {svc.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* % CPU Đang sử dụng (Thực tế hoặc Theo Backend/Cloud) */}
                    <td className="py-4 px-5 text-center">
                      {svc.cpuPercent !== null && svc.cpuPercent !== undefined ? (
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-bold text-xs ${
                            svc.cpuPercent > 30 ? 'text-rose-600 font-extrabold' : (isLight ? 'text-slate-800' : 'text-slate-200')
                          }`}>
                            {svc.cpuPercent}%
                          </span>
                          <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 shadow-2xs">
                            <div
                              className={`h-full ${
                                svc.cpuPercent > 30 ? 'bg-rose-500' : (svc.cpuPercent > 10 ? 'bg-amber-500' : 'bg-blue-500')
                              }`}
                              style={{ width: `${Math.min(100, Math.max(6, svc.cpuPercent * 3))}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          {svc.key === 'mongodb' ? 'Atlas Cloud' : 'Theo Backend'}
                        </span>
                      )}
                    </td>

                    {/* RAM Lẻ MB / GB (Số thật hoặc Tích hợp) */}
                    <td className="py-4 px-5 text-center font-mono">
                      {svc.ramMb ? (
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-xs border ${
                          isLight ? 'bg-slate-100/80 text-slate-900 border-slate-200' : 'bg-slate-900 text-slate-200 border-slate-800'
                        }`}>
                          {svc.ramMb >= 1024 ? `${(svc.ramMb / 1024).toFixed(2)} GB` : `${svc.ramMb} MB`}
                        </span>
                      ) : (
                        <span className={`text-[11px] font-sans px-2.5 py-1 rounded-lg font-medium border ${
                          isLight ? 'text-slate-600 bg-slate-100/80 border-slate-200' : 'text-slate-400 bg-slate-900/80 border-slate-800'
                        }`}>
                          {svc.ramDisplay || 'Trong Backend'}
                        </span>
                      )}
                    </td>

                    {/* % Chiếm dụng so với RAM tổng */}
                    <td className="py-4 px-5 text-center">
                      {svc.ramPercent !== null && svc.ramPercent !== undefined ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-xs" style={{ color: svc.key === 'os_system' ? '#64748b' : undefined }}>
                            {svc.ramPercent}%
                          </span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                            / {vps.totalRamGb || ((ram.totalMb || 0) / 1024).toFixed(1)} GB
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">--</span>
                      )}
                    </td>

                    {/* Trạng thái & Chi tiết */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          svc.status === 'connected' || svc.status === 'healthy' || svc.status === 'ready' || svc.status === 'stable'
                            ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800')
                            : (svc.status === 'standby'
                                ? (isLight ? 'bg-slate-100 text-slate-700 border border-slate-300' : 'bg-slate-900 text-slate-300 border border-slate-700')
                                : 'bg-amber-50 text-amber-700 border border-amber-300')
                        }`}>
                          <CheckCircle2 size={10} />
                          {svc.status === 'connected'
                            ? 'Đang kết nối'
                            : (svc.status === 'healthy'
                                ? 'Hoạt động tốt'
                                : (svc.status === 'fallback_memory'
                                    ? 'L1 RAM Hoạt Động'
                                    : (svc.status === 'standby' ? 'Chế độ Trực Tiếp' : 'Sẵn sàng')))}
                        </span>
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                          isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-slate-300'
                        }`}>
                          {svc.details}
                        </span>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

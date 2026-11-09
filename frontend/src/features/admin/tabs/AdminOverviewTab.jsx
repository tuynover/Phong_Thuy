import React, { useState, useMemo } from 'react';
import {
  Users,
  Layers,
  Activity,
  Heart,
  Compass,
  Hash,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Coins,
  PieChart as PieChartIcon,
  Bot,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';
import CustomDatePicker from '@/components/common/CustomDatePicker';
import AdminSystemHealthCard from '@/features/admin/components/AdminSystemHealthCard';
import { useAdminTheme } from '@/features/admin/context/AdminThemeContext';

export default function AdminOverviewTab({
  analytics,
  analyticsLoading,
  alerts = [],
  appeals = [],
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  groupBy,
  setGroupBy,
  tokenChartMetric,
  setTokenChartMetric,
  onPresetClick,
  onNavigateToAlerts,
  onUserClick,
  health,
  queueStatus,
  healthLoading,
  onRefreshHealth,
  onOpenDlqModal,
  onNavigateToSystem
}) {
  const { isLight } = useAdminTheme();
  // Multi-Dashboard View Switcher: 'executive' | 'matrix' | 'ai' | 'consumption'
  const [dashboardView, setDashboardView] = useState('executive');

  const handlePresetClick = React.useCallback((days) => {
    if (onPresetClick) {
      onPresetClick(days);
    } else {
      const now = Date.now();
      const start = new Date(now - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = new Date(now).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    }
  }, [onPresetClick, setStartDate, setEndDate]);

  // Transform timeline chart data
  const chartData = useMemo(() => {
    if (!analytics?.timeline || analytics.timeline.length === 0) return [];
    return analytics.timeline.map(entry => {
      const total = entry.tokens || 0;
      return {
        ...entry,
        ichingTotal: (entry.ichingInterpretTokens || 0) + (entry.ichingChatTokens || 0),
        baziTotal: (entry.baziInterpretTokens || 0) + (entry.baziChatTokens || 0),
        ziweiTotal: (entry.ziweiInterpretTokens || 0) + (entry.ziweiChatTokens || 0),
        marriageTotal: (entry.marriageInterpretTokens || 0) + (entry.marriageChatTokens || 0),
        feixingTotal: (entry.feixingInterpretTokens || 0) + (entry.feixingChatTokens || 0),
        numerologyTotal: (entry.numerologyInterpretTokens || 0) + (entry.numerologyChatTokens || 0),
        interpretRatio: total > 0 ? Math.round(((entry.interpretTokens || 0) / total) * 100) : 0,
        chatRatio: total > 0 ? Math.round(((entry.chatTokens || 0) / total) * 100) : 0
      };
    });
  }, [analytics?.timeline]);

  // Transform Divination matrix for Pie / Bar
  const categoryMatrixData = useMemo(() => {
    if (!analytics?.overview) return [];
    const {
      totalIching = 0,
      totalBazi = 0,
      totalZiwei = 0,
      totalMarriage = 0,
      totalFeixing = 0,
      totalNumerology = 0
    } = analytics.overview;

    const list = [
      { name: 'Kinh Dịch', value: totalIching, color: '#f59e0b', icon: Layers },
      { name: 'Bát Tự', value: totalBazi, color: '#3b82f6', icon: Activity },
      { name: 'Tử Vi', value: totalZiwei, color: '#a855f7', icon: Activity },
      { name: 'Hợp Hôn', value: totalMarriage, color: '#f43f5e', icon: Heart },
      { name: 'Phi Tinh', value: totalFeixing, color: '#10b981', icon: Compass },
      { name: 'Phong Thủy Số', value: totalNumerology, color: '#06b6d4', icon: Hash }
    ];
    const total = list.reduce((acc, cur) => acc + cur.value, 0);
    return list.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
    }));
  }, [analytics?.overview]);

  const unreadAlertsCount = alerts.filter(a => a.status === 'unread').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* SYSTEM HEALTH & QUEUE MONITORING CARD (DEV OPS) */}
      <AdminSystemHealthCard
        health={health}
        queueStatus={queueStatus}
        loading={healthLoading}
        onRefresh={onRefreshHealth}
        onOpenDlqModal={onOpenDlqModal}
        onOpenDetailModal={onNavigateToSystem}
      />

      {/* SYSTEM WARNING BANNER */}
      {(unreadAlertsCount > 0 || appeals.length > 0) && (
        <div className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
          isLight
            ? 'bg-rose-50/80 border-rose-200 text-rose-900 shadow-xs'
            : 'bg-red-950/30 border-red-900/60 text-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-rose-500 shrink-0" size={24} />
            <div className="text-xs sm:text-sm">
              <span className="font-bold">Cảnh báo hệ thống:</span> Hiện đang có 
              <span className="font-extrabold mx-1 text-rose-600">{unreadAlertsCount} cảnh báo mới</span> 
              và <span className="font-extrabold mx-1 text-rose-600">{appeals.length} khiếu nại tài khoản</span> cần được xem xét xử lý.
            </div>
          </div>
          <button 
            type="button"
            onClick={onNavigateToAlerts}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs tracking-wider transition-colors shrink-0 cursor-pointer shadow-xs active:scale-95"
          >
            XỬ LÝ NGAY
          </button>
        </div>
      )}

      {/* ========================================================
          MULTI-DASHBOARD VIEW SELECTOR (KHÔNG TỐN DIỆN TÍCH)
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className={`font-serif text-lg sm:text-xl font-bold flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-slate-100'
          }`}>
            <BarChart3 size={20} className="text-amber-500" />
            Bảng Chỉ Số Phân Tích Thông Minh
          </h3>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Chuyển đổi linh hoạt giữa các góc nhìn dữ liệu mà không cần tải lại trang
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className={`inline-flex items-center p-1 rounded-2xl border transition-all self-start md:self-auto flex-wrap ${
          isLight
            ? 'bg-slate-100/90 border-slate-200/80 shadow-inner'
            : 'bg-slate-950/80 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => setDashboardView('executive')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dashboardView === 'executive'
                ? (isLight ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'bg-amber-600 text-white shadow-md')
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
            }`}
          >
            <TrendingUp size={14} className={dashboardView === 'executive' ? 'text-amber-500' : 'opacity-60'} />
            <span>Tổng Quan Điều Hành</span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardView('matrix')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dashboardView === 'matrix'
                ? (isLight ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'bg-amber-600 text-white shadow-md')
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
            }`}
          >
            <PieChartIcon size={14} className={dashboardView === 'matrix' ? 'text-amber-500' : 'opacity-60'} />
            <span>Ma Trận Phân Hệ</span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardView('ai')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dashboardView === 'ai'
                ? (isLight ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'bg-amber-600 text-white shadow-md')
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
            }`}
          >
            <Bot size={14} className={dashboardView === 'ai' ? 'text-amber-500' : 'opacity-60'} />
            <span>Hiệu Suất AI & Token</span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardView('consumption')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dashboardView === 'consumption'
                ? (isLight ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'bg-amber-600 text-white shadow-md')
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
            }`}
          >
            <Users size={14} className={dashboardView === 'consumption' ? 'text-amber-500' : 'opacity-60'} />
            <span>Tiêu Dùng Hội Viên</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          DATE RANGE CONTROLLER (ÁP DỤNG CHUNG CHO TOÀN BỘ DASHBOARD)
          ======================================================== */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={15} className="text-amber-500" />
          <CustomDatePicker
            value={startDate}
            onChange={(val) => setStartDate(val)}
            label="Từ:"
            activeTheme="amber"
            maxDate={endDate}
            align="left"
          />
          <CustomDatePicker
            value={endDate}
            onChange={(val) => setEndDate(val)}
            label="Đến:"
            activeTheme="amber"
            minDate={startDate}
            align="right"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Group by */}
          <div className={`flex p-1 rounded-xl border gap-1 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setGroupBy('day')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                groupBy === 'day'
                  ? (isLight ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-700 text-white')
                  : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
              }`}
            >
              Ngày
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('hour')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                groupBy === 'hour'
                  ? (isLight ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-700 text-white')
                  : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
              }`}
            >
              Giờ
            </button>
          </div>

          {/* Quick presets */}
          <div className={`flex p-1 rounded-xl border gap-1 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            {[7, 30, 90].map(days => (
              <button
                key={days}
                type="button"
                onClick={() => handlePresetClick(days)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days}N
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          LOẠI HÌNH 1: EXECUTIVE DASHBOARD (TỔNG QUAN ĐIỀU HÀNH)
          ======================================================== */}
      {dashboardView === 'executive' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* STATS OVERVIEW CARDS */}
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
              <div className={`p-4 rounded-2xl flex flex-col justify-between border transition-all ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Users size={14} className="text-blue-500" />
                  Thành Viên
                </span>
                <span className={`text-2xl sm:text-3xl font-extrabold mt-2 font-serif ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {analytics.overview?.totalUsers || 0}
                </span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col justify-between border transition-all ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Layers size={14} className="text-amber-500" />
                  Kinh Dịch
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-amber-500">
                  {analytics.overview?.totalIching || 0}
                </span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col justify-between border transition-all ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Activity size={14} className="text-blue-500" />
                  Bát Tự
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-blue-500">
                  {analytics.overview?.totalBazi || 0}
                </span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col justify-between border transition-all ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Activity size={14} className="text-purple-500" />
                  Tử Vi
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-purple-500">
                  {analytics.overview?.totalZiwei || 0}
                </span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col justify-between border transition-all ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Heart size={14} className="text-rose-500" />
                  Hợp Hôn
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-rose-500">
                  {analytics.overview?.totalMarriage || 0}
                </span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col justify-between border transition-all ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Compass size={14} className="text-emerald-500" />
                  Phi Tinh
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-emerald-500">
                  {analytics.overview?.totalFeixing || 0}
                </span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col justify-between border transition-all ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Hash size={14} className="text-cyan-500" />
                  Phong Thủy Số
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-cyan-500">
                  {analytics.overview?.totalNumerology || 0}
                </span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col justify-between border transition-all ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <MessageSquare size={14} className="text-red-500" />
                  Khiếu Nại
                </span>
                <span className={`text-2xl sm:text-3xl font-extrabold mt-2 font-serif ${
                  (analytics.overview?.totalAppeals || 0) > 0
                    ? 'text-red-500 animate-pulse'
                    : (isLight ? 'text-slate-900' : 'text-slate-100')
                }`}>
                  {analytics.overview?.totalAppeals || 0}
                </span>
              </div>
            </div>
          )}

          {/* Biểu đồ dòng thời gian truy cập & dịch lý */}
          <div className={`border p-5 sm:p-6 rounded-3xl space-y-4 transition-all ${
            isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Lưu Lượng Truy Cập & Tương Tác Dịch Lý
                </h4>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Khối lượng request và phiên phân tích phong thủy phân bổ theo mốc thời gian
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorIching" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#f1f5f9' : '#1e293b'} />
                  <XAxis dataKey="date" stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={10} />
                  <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={10} />
                  <ChartTooltip contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#0f172a',
                    borderColor: isLight ? '#e2e8f0' : '#1e293b',
                    borderRadius: '12px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }} />
                  <Legend />
                  <Area name="Lượt Truy Cập" type="monotone" dataKey="visits" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={2} />
                  <Area name="Kinh Dịch" type="monotone" dataKey="iching" stroke="#f59e0b" fillOpacity={1} fill="url(#colorIching)" strokeWidth={2} />
                  <Area name="Bát Tự" type="monotone" dataKey="bazi" stroke="#06b6d4" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                  <Area name="Tử Vi" type="monotone" dataKey="ziwei" stroke="#a855f7" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                  <Area name="Hợp Hôn" type="monotone" dataKey="marriage" stroke="#f43f5e" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                  <Area name="Phi Tinh" type="monotone" dataKey="feixing" stroke="#10b981" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                  <Area name="Phong Thủy Số" type="monotone" dataKey="numerology" stroke="#06b6d4" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          LOẠI HÌNH 2: MA TRẬN PHÂN HỆ (DIVINATION MATRIX DASHBOARD)
          ======================================================== */}
      {dashboardView === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Biểu đồ Donut / Pie */}
          <div className={`p-5 sm:p-6 rounded-3xl border space-y-4 transition-all ${
            isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
          }`}>
            <div>
              <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Tỷ Trọng Phân Bổ 6 Phân Hệ Phong Thủy
              </h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Cơ cấu phân chia số lượng lá số và dịch bản trong toàn hệ thống
              </p>
            </div>

            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={categoryMatrixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryMatrixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#0f172a',
                    borderColor: isLight ? '#e2e8f0' : '#1e293b',
                    borderRadius: '12px',
                    color: isLight ? '#0f172a' : '#f8fafc'
                  }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Danh sách thẻ phân loại & tỷ lệ */}
          <div className={`p-5 sm:p-6 rounded-3xl border space-y-3 transition-all ${
            isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
          }`}>
            <div>
              <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Xếp Hạng Nhu Cầu Theo Phân Hệ
              </h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Số lượng bản ghi thực tế và tỷ lệ thị phần quan tâm của người dùng
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {categoryMatrixData.map((cat, idx) => {
                const IconComponent = cat.icon;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isLight ? 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100/60' : 'bg-slate-900/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                        <IconComponent size={16} />
                      </span>
                      <div>
                        <span className={`font-bold text-xs block ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                          {cat.name}
                        </span>
                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          Thị phần: {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-serif" style={{ color: cat.color }}>
                        {cat.value.toLocaleString()}
                      </span>
                      <span className={`text-[10px] block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>bản ghi</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          LOẠI HÌNH 3: HIỆU SUẤT AI & TOKEN (AI INTELLIGENCE DASHBOARD)
          ======================================================== */}
      {dashboardView === 'ai' && (
        <div className={`p-5 sm:p-6 rounded-3xl border space-y-6 transition-all animate-in fade-in duration-200 ${
          isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-950/40 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200/60 dark:border-slate-800/60">
            <div>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                <Bot size={18} className="text-purple-500" />
                Phân Tích Tiêu Thụ Token Google Gemini AI
              </h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Giám sát khối lượng token sử dụng cho phân hệ dịch lý và trò chuyện chuyên sâu
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Phân bổ theo:
              </span>
              <select
                value={tokenChartMetric}
                onChange={(e) => setTokenChartMetric(e.target.value)}
                className={`text-xs rounded-xl px-3 py-1.5 font-bold cursor-pointer border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                <option value="subject">Phân hệ Môn học</option>
                <option value="type">Mục đích (Luận giải vs Chat)</option>
                <option value="ratio">Tỷ lệ phần trăm (%)</option>
              </select>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              {tokenChartMetric === 'ratio' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRatioInterpret" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRatioChat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#f1f5f9' : '#1e293b'} />
                  <XAxis dataKey="date" stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={10} />
                  <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={10} unit="%" domain={[0, 100]} />
                  <ChartTooltip contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#0f172a',
                    borderColor: isLight ? '#e2e8f0' : '#1e293b',
                    borderRadius: '12px',
                    color: isLight ? '#0f172a' : '#f8fafc'
                  }} />
                  <Legend />
                  <Area name="% Luận Giải" type="monotone" dataKey="interpretRatio" stroke="#10b981" fillOpacity={1} fill="url(#colorRatioInterpret)" strokeWidth={2} />
                  <Area name="% Trò Chuyện" type="monotone" dataKey="chatRatio" stroke="#ec4899" fillOpacity={1} fill="url(#colorRatioChat)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#f1f5f9' : '#1e293b'} />
                  <XAxis dataKey="date" stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={10} />
                  <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={10} />
                  <ChartTooltip contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#0f172a',
                    borderColor: isLight ? '#e2e8f0' : '#1e293b',
                    borderRadius: '12px',
                    color: isLight ? '#0f172a' : '#f8fafc'
                  }} />
                  <Legend />
                  {tokenChartMetric === 'subject' ? (
                    <>
                      <Bar name="Kinh Dịch" dataKey="ichingTotal" stackId="tokens" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar name="Bát Tự" dataKey="baziTotal" stackId="tokens" fill="#06b6d4" />
                      <Bar name="Tử Vi" dataKey="ziweiTotal" stackId="tokens" fill="#a855f7" />
                      <Bar name="Hợp Hôn" dataKey="marriageTotal" stackId="tokens" fill="#f43f5e" />
                      <Bar name="Phi Tinh" dataKey="feixingTotal" stackId="tokens" fill="#10b981" />
                      <Bar name="Phong Thủy Số" dataKey="numerologyTotal" stackId="tokens" fill="#06b6d4" />
                    </>
                  ) : (
                    <>
                      <Bar name="Luận Giải AI" dataKey="interpretTokens" stackId="tokens" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar name="Trò Chuyện AI" dataKey="chatTokens" stackId="tokens" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </>
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ========================================================
          LOẠI HÌNH 4: TIÊU DÙNG HỘI VIÊN (USER CONSUMPTION DASHBOARD)
          ======================================================== */}
      {dashboardView === 'consumption' && (
        <div className={`border p-5 sm:p-6 rounded-3xl space-y-4 transition-all animate-in fade-in duration-200 ${
          isLight ? 'bg-white border-slate-200/80 shadow-xs text-slate-800' : 'bg-slate-950/40 border-slate-800 text-slate-100'
        }`}>
          <div>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              <Coins size={18} className="text-purple-500" />
              Bảng Xếp Hạng Tiêu Dùng Tài Nguyên
            </h4>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Danh sách hội viên tiêu thụ Token AI và lượt luận giải nhiều nhất trong kỳ thống kê
            </p>
          </div>

          {analyticsLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : analytics && analytics.userConsumption && analytics.userConsumption.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-bold uppercase tracking-wider text-[11px] ${
                    isLight ? 'bg-slate-50/80 border-slate-200 text-slate-500' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}>
                    <th className="py-3 px-4">Hội Viên</th>
                    <th className="py-3 px-4 text-center">Token AI</th>
                    <th className="py-3 px-4 text-center">Kinh Dịch</th>
                    <th className="py-3 px-4 text-center">Bát Tự</th>
                    <th className="py-3 px-4 text-center">Tử Vi</th>
                    <th className="py-3 px-4 text-center">Hợp Hôn</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200/60' : 'divide-slate-800/60'}`}>
                  {analytics.userConsumption.map((uc, index) => (
                    <tr key={index} className={`transition-colors ${isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-900/40'}`}>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onUserClick && onUserClick(uc.userId)}
                          className={`font-bold text-left transition-colors hover:underline cursor-pointer ${
                            isLight ? 'text-slate-900 hover:text-amber-600' : 'text-slate-200 hover:text-amber-500'
                          }`}
                        >
                          {uc.name}
                        </button>
                        <div className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{uc.email}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-purple-500">
                        {uc.tokens.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-center ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{uc.iching}</td>
                      <td className={`py-3 px-4 text-center ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{uc.bazi}</td>
                      <td className={`py-3 px-4 text-center ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{uc.ziwei}</td>
                      <td className={`py-3 px-4 text-center ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{uc.marriage || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`text-center py-10 text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Chưa có dữ liệu tiêu thụ tài nguyên của hội viên trong thời gian này.
            </div>
          )}
        </div>
      )}

    </div>
  );
}

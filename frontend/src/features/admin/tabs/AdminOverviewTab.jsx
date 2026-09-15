import React from 'react';
import {
  Users,
  Layers,
  Activity,
  Heart,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Coins
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';
import CustomDatePicker from '@/components/common/CustomDatePicker';
import AdminSystemHealthCard from '@/features/admin/components/AdminSystemHealthCard';

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
  onOpenDlqModal
}) {
  const handlePresetClick = (days) => {
    if (onPresetClick) {
      onPresetClick(days);
    } else {
      const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = new Date().toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* SYSTEM HEALTH & QUEUE MONITORING CARD */}
      <AdminSystemHealthCard
        health={health}
        queueStatus={queueStatus}
        loading={healthLoading}
        onRefresh={onRefreshHealth}
        onOpenDlqModal={onOpenDlqModal}
      />

      {/* STATS OVERVIEW CARDS */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-blue-550" />
              Thành Viên
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-slate-100">{analytics.overview.totalUsers}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-amber-550" />
              Quẻ Kinh Dịch
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-amber-500">{analytics.overview.totalIching}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-blue-550" />
              Lá Số Bát Tự
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-blue-500">{analytics.overview.totalBazi}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-purple-550" />
              Lá Số Tử Vi
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-purple-500">{analytics.overview.totalZiwei}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Heart size={14} className="text-rose-550" />
              Hợp Hôn
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-rose-500">{analytics.overview.totalMarriage || 0}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={14} className="text-red-550" />
              Khiếu Nại Chờ
            </span>
            <span className={`text-2xl sm:text-3xl font-extrabold mt-2 font-serif ${analytics.overview.totalAppeals > 0 ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
              {analytics.overview.totalAppeals}
            </span>
          </div>
        </div>
      )}

      {/* SYSTEM WARNING BANNER */}
      {(alerts.filter(a => a.status === 'unread').length > 0 || appeals.length > 0) && (
        <div className="bg-red-950/30 border border-red-900/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <div className="text-sm">
              <span className="font-bold">Cảnh báo hệ thống:</span> Hiện đang có 
              <span className="font-extrabold mx-1 text-red-400">{alerts.filter(a => a.status === 'unread').length} cảnh báo mới</span> 
              và <span className="font-extrabold mx-1 text-red-400">{appeals.length} khiếu nại tài khoản</span> cần được xem xét xử lý.
            </div>
          </div>
          <button 
            onClick={onNavigateToAlerts}
            className="bg-red-800 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs tracking-wider transition-colors shrink-0 cursor-pointer"
          >
            XỬ LÝ NGAY
          </button>
        </div>
      )}

      {/* RECHARTS TIMELINE GRAPHICS */}
      <div className="bg-slate-950/40 border border-slate-800 p-4 sm:p-6 rounded-3xl space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-500" />
              Biểu Đồ Hoạt Động Hệ Thống
            </h3>
            <p className="text-xs text-slate-400">Thống kê lưu lượng, dịch lý và mức tiêu thụ Token AI</p>
          </div>

          {/* Date pickers & Group By & Presets */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
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

            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1">
              <button
                onClick={() => setGroupBy('day')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${groupBy === 'day' ? 'bg-amber-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Ngày
              </button>
              <button
                onClick={() => setGroupBy('hour')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${groupBy === 'hour' ? 'bg-amber-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Giờ
              </button>
            </div>

            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1">
              {[7, 30, 90].map(days => (
                <button
                  key={days}
                  onClick={() => handlePresetClick(days)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {days}N
                </button>
              ))}
            </div>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
        ) : analytics && analytics.timeline && analytics.timeline.length > 0 ? (
          (() => {
            const chartData = analytics.timeline.map(entry => {
              const total = entry.tokens || 0;
              return {
                ...entry,
                ichingTotal: (entry.ichingInterpretTokens || 0) + (entry.ichingChatTokens || 0),
                baziTotal: (entry.baziInterpretTokens || 0) + (entry.baziChatTokens || 0),
                ziweiTotal: (entry.ziweiInterpretTokens || 0) + (entry.ziweiChatTokens || 0),
                marriageTotal: (entry.marriageInterpretTokens || 0) + (entry.marriageChatTokens || 0),
                interpretRatio: total > 0 ? Math.round(((entry.interpretTokens || 0) / total) * 100) : 0,
                chatRatio: total > 0 ? Math.round(((entry.chatTokens || 0) / total) * 100) : 0
              };
            });
            return (
              <div className="space-y-8">
                {/* Visits & Interpretation Chart */}
                <div className="h-72 w-full">
                  <span className="text-xs text-slate-400 font-bold block mb-2">1. Lượt truy cập (Visit Logs) & Lượt dịch lý (AI Interpretations)</span>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorIching" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <ChartTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                      <Legend />
                      <Area name="Truy cập" type="monotone" dataKey="visits" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={2} />
                      <Area name="Kinh Dịch" type="monotone" dataKey="iching" stroke="#f59e0b" fillOpacity={1} fill="url(#colorIching)" strokeWidth={2} />
                      <Area name="Bát Tự" type="monotone" dataKey="bazi" stroke="#06b6d4" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
                      <Area name="Tử Vi" type="monotone" dataKey="ziwei" stroke="#a855f7" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
                      <Area name="Hợp Hôn" type="monotone" dataKey="marriage" stroke="#f43f5e" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Token Usage Chart */}
                <div className="h-80 w-full space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                    <span className="text-xs text-slate-400 font-bold block text-purple-400">2. Phân Tích Tiêu Thụ Token AI</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-550 font-bold uppercase">Phân tích theo:</span>
                      <select
                        value={tokenChartMetric}
                        onChange={(e) => setTokenChartMetric(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-[11px] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
                      >
                        <option value="subject">Phân bổ Môn học (Kinh Dịch / Bát Tự / Tử Vi / Hôn Nhân)</option>
                        <option value="type">Phân bổ Mục đích (Luận giải / Trò chuyện)</option>
                        <option value="ratio">Tỷ lệ phần trạng (Luận giải vs Trò chuyện %)</option>
                      </select>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="90%" minWidth={0} minHeight={0}>
                    {tokenChartMetric === 'ratio' ? (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRatioInterpret" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRatioChat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} unit="%" domain={[0, 100]} />
                        <ChartTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                        <Legend />
                        <Area name="% Luận Giải" type="monotone" dataKey="interpretRatio" stroke="#10b981" fillOpacity={1} fill="url(#colorRatioInterpret)" strokeWidth={2} />
                        <Area name="% Trò Chuyện" type="monotone" dataKey="chatRatio" stroke="#ec4899" fillOpacity={1} fill="url(#colorRatioChat)" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <ChartTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                        <Legend />
                        {tokenChartMetric === 'subject' ? (
                          <>
                            <Bar name="Kinh Dịch" dataKey="ichingTotal" stackId="tokens" fill="#f59e0b" />
                            <Bar name="Bát Tự" dataKey="baziTotal" stackId="tokens" fill="#06b6d4" />
                            <Bar name="Tử Vi" dataKey="ziweiTotal" stackId="tokens" fill="#a855f7" />
                            <Bar name="Hợp Hôn" dataKey="marriageTotal" stackId="tokens" fill="#f43f5e" />
                          </>
                        ) : (
                          <>
                            <Bar name="Luận Giải AI" dataKey="interpretTokens" stackId="tokens" fill="#10b981" />
                            <Bar name="Trò Chuyện AI" dataKey="chatTokens" stackId="tokens" fill="#ec4899" />
                          </>
                        )}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="h-72 flex items-center justify-center text-slate-500 font-semibold text-sm">
            Không tìm thấy dữ liệu hoạt động trong thời gian này.
          </div>
        )}
      </div>

      {/* USER RESOURCE SPIKE DRILL DOWN TABLE */}
      <div className="bg-slate-950/40 border border-slate-800 p-4 sm:p-6 rounded-3xl space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold flex items-center gap-2">
            <Coins size={18} className="text-purple-500" />
            Thống Kê Tiêu Dùng Tài Nguyên
          </h3>
          <p className="text-xs text-slate-400">Danh sách thành viên tiêu thụ Token AI và lượt luận giải nhiều nhất</p>
        </div>

        {analyticsLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
        ) : analytics && analytics.userConsumption && analytics.userConsumption.length > 0 ? (
          <>
            {/* Desktop view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="pb-3 pr-2">Hội Viên</th>
                    <th className="pb-3 text-center">Token AI</th>
                    <th className="pb-3 text-center">Kinh Dịch</th>
                    <th className="pb-3 text-center">Bát Tự</th>
                    <th className="pb-3 text-center">Tử Vi</th>
                    <th className="pb-3 text-center">Hợp Hôn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {analytics.userConsumption.map((uc, index) => (
                    <tr key={index} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 pr-2">
                        <button
                          type="button"
                          onClick={() => onUserClick && onUserClick(uc.userId)}
                          className="font-bold text-slate-200 hover:text-amber-500 text-left transition-colors hover:underline cursor-pointer"
                        >
                          {uc.name}
                        </button>
                        <div className="text-[11px] text-slate-550">{uc.email}</div>
                      </td>
                      <td className="py-3.5 text-center font-extrabold text-purple-400">
                        {uc.tokens.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-center text-slate-300">{uc.iching}</td>
                      <td className="py-3.5 text-center text-slate-300">{uc.bazi}</td>
                      <td className="py-3.5 text-center text-slate-300">{uc.ziwei}</td>
                      <td className="py-3.5 text-center text-slate-300">{uc.marriage || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile view */}
            <div className="block md:hidden divide-y divide-slate-850 space-y-3">
              {analytics.userConsumption.map((uc, index) => (
                <div key={index} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <button
                        type="button"
                        onClick={() => onUserClick && onUserClick(uc.userId)}
                        className="font-bold text-slate-200 hover:text-amber-500 text-left transition-colors text-sm hover:underline cursor-pointer"
                      >
                        {uc.name}
                      </button>
                      <div className="text-[11px] text-slate-500">{uc.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-purple-400">{uc.tokens.toLocaleString()} tokens</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-450 border-t border-slate-800/40 pt-2">
                    <span>Kinh Dịch: <strong className="text-slate-300">{uc.iching}</strong></span>
                    <span className="text-slate-700">|</span>
                    <span>Bát Tự: <strong className="text-slate-300">{uc.bazi}</strong></span>
                    <span className="text-slate-700">|</span>
                    <span>Tử Vi: <strong className="text-slate-300">{uc.ziwei}</strong></span>
                    <span className="text-slate-700">|</span>
                    <span>Hợp Hôn: <strong className="text-slate-300">{uc.marriage || 0}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm">
            Chưa có dữ liệu tiêu thụ tài nguyên của hội viên.
          </div>
        )}
      </div>
    </div>
  );
}

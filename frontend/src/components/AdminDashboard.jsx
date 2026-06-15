import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserCredits,
  lockAdminUser,
  unlockAdminUser,
  deleteAdminUser,
  getAdminCalculations,
  lockAdminCalculation,
  unlockAdminCalculation,
  deleteAdminCalculation,
  getAdminAnalytics,
  getAdminNotifications,
  markAdminNotificationRead,
  resolveAdminAppeal
} from '../services/api';
import {
  Shield,
  Users,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Check,
  X,
  Search,
  Filter,
  Lock,
  Unlock,
  Trash2,
  Calendar,
  Info,
  Coins,
  Eye,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight
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

export default function AdminDashboard() {
  const { user: currentUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'calculations' | 'alerts'
  const [loading, setLoading] = useState(false);

  // Time range for analytics
  const [timeRange, setTimeRange] = useState(30); // 7 | 30 | 90
  const [analytics, setAnalytics] = useState(null);

  // Warnings / Appeals
  const [alerts, setAlerts] = useState([]);
  const [appeals, setAppeals] = useState([]);

  // User management
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(10);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // User edit states
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditChange, setCreditChange] = useState('');
  const [creditMode, setCreditMode] = useState('add'); // 'add' | 'subtract' | 'set'
  const [lockReason, setLockReason] = useState('');
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  // Calculation management
  const [calcType, setCalcType] = useState('iching'); // 'iching' | 'bazi' | 'tuvi'
  const [calculations, setCalculations] = useState([]);
  const [calcTotal, setCalcTotal] = useState(0);
  const [calcPage, setCalcPage] = useState(1);
  const [calcLimit] = useState(10);
  const [calcSearch, setCalcSearch] = useState('');
  const [calcStatusFilter, setCalcStatusFilter] = useState('');
  const [selectedCalc, setSelectedCalc] = useState(null);

  // Fetch initial system warnings and appeals
  useEffect(() => {
    fetchAlertsAndAppeals();
  }, []);

  // Fetch analytics when tab or timeRange changes
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchAnalyticsData();
    }
  }, [activeTab, timeRange]);

  // Fetch users when filters or page changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsersData();
    }
  }, [activeTab, userPage, userRoleFilter, userStatusFilter]);

  // Fetch calculations when type, filters or page changes
  useEffect(() => {
    if (activeTab === 'calculations') {
      fetchCalculationsData();
    }
  }, [activeTab, calcType, calcPage, calcStatusFilter]);

  const fetchAlertsAndAppeals = async () => {
    try {
      const res = await getAdminNotifications();
      setAlerts(res.data.alerts || []);
      setAppeals(res.data.appeals || []);
    } catch (err) {
      console.error('Lỗi khi tải thông báo/khiếu nại:', err);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const start = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = new Date().toISOString().split('T')[0];
      const res = await getAdminAnalytics(start, end);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thống kê:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersData = async () => {
    setLoading(true);
    try {
      const params = {
        page: userPage,
        limit: userLimit,
        search: userSearch,
        role: userRoleFilter,
        status: userStatusFilter
      };
      const res = await getAdminUsers(params);
      setUsers(res.data.users || []);
      setUserTotal(res.data.total || 0);
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalculationsData = async () => {
    setLoading(true);
    try {
      const params = {
        type: calcType,
        page: calcPage,
        limit: calcLimit,
        search: calcSearch,
        status: calcStatusFilter
      };
      const res = await getAdminCalculations(params);
      setCalculations(res.data.records || []);
      setCalcTotal(res.data.total || 0);
    } catch (err) {
      console.error('Lỗi tải danh sách quẻ/lá số:', err);
    } finally {
      setLoading(false);
    }
  };

  // Co-admin checks
  const canManage = (targetUser) => {
    if (!targetUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'co-admin') {
      return targetUser.role !== 'admin' && targetUser.role !== 'co-admin';
    }
    return false;
  };

  // Handlers for Member Management
  const handleRoleChange = async (userId, newRole) => {
    const targetUser = users.find(u => u._id === userId);
    if (!canManage(targetUser)) {
      alert('Bạn không có quyền quản lý tài khoản cấp bậc này.');
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn chuyển vai trò tài khoản sang "${newRole}"?`)) return;

    try {
      await updateAdminUserRole(userId, newRole);
      alert('Cập nhật vai trò thành công.');
      fetchUsersData();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật vai trò.');
    }
  };

  const handleUpdateCreditsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!canManage(selectedUser)) {
      alert('Bạn không có quyền chỉnh sửa credit của tài khoản này.');
      return;
    }
    const amount = parseInt(creditChange);
    if (isNaN(amount) || amount < 0) {
      alert('Số lượt sử dụng không hợp lệ.');
      return;
    }

    try {
      await updateAdminUserCredits(selectedUser._id, amount, creditMode);
      alert('Cập nhật lượt sử dụng thành công.');
      setCreditChange('');
      setSelectedUser(null);
      fetchUsersData();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật lượt sử dụng.');
    }
  };

  const handleLockUserSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !lockReason.trim()) return;
    if (!canManage(selectedUser)) {
      alert('Bạn không có quyền khóa tài khoản này.');
      return;
    }

    try {
      await lockAdminUser(selectedUser._id, lockReason);
      alert('Khóa tài khoản thành công.');
      setIsLockModalOpen(false);
      setLockReason('');
      setSelectedUser(null);
      fetchUsersData();
      fetchAlertsAndAppeals();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi khóa tài khoản.');
    }
  };

  const handleUnlockUser = async (userObj) => {
    if (!canManage(userObj)) {
      alert('Bạn không có quyền mở khóa tài khoản này.');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn mở khóa tài khoản ${userObj.email}?`)) return;

    try {
      await unlockAdminUser(userObj._id);
      alert('Mở khóa tài khoản thành công.');
      fetchUsersData();
      fetchAlertsAndAppeals();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi mở khóa tài khoản.');
    }
  };

  const handleDeleteUser = async (userObj) => {
    if (!canManage(userObj)) {
      alert('Bạn không có quyền xóa tài khoản này.');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa (xóa mềm) tài khoản ${userObj.email}? Tài khoản này sẽ bị đánh dấu xóa.`)) return;

    try {
      await deleteAdminUser(userObj._id);
      alert('Xóa tài khoản thành công.');
      fetchUsersData();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi xóa tài khoản.');
    }
  };

  // Handlers for Calculation Moderation
  const handleLockCalculation = async (calc) => {
    const actionStr = calc.status === 'locked' ? 'mở khóa' : 'khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionStr} bản ghi luận giải này?`)) return;

    try {
      if (calc.status === 'locked') {
        await unlockAdminCalculation(calcType, calc._id);
      } else {
        await lockAdminCalculation(calcType, calc._id);
      }
      alert(`Đã ${actionStr} bản ghi luận giải.`);
      fetchCalculationsData();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi cập nhật bản ghi.');
    }
  };

  const handleDeleteCalculation = async (calc) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mềm bản ghi này khỏi lịch sử của người dùng?')) return;

    try {
      await deleteAdminCalculation(calcType, calc._id);
      alert('Đã xóa bản ghi (xóa mềm).');
      fetchCalculationsData();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi xóa bản ghi.');
    }
  };

  // Handlers for Warnings / Appeals
  const handleMarkAlertRead = async (alertId) => {
    try {
      await markAdminNotificationRead(alertId);
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'read' } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveAppeal = async (appealId, action) => {
    const actionStr = action === 'approve' ? 'chấp thuận (mở khóa tài khoản)' : 'bác bỏ khiếu nại';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionStr} này?`)) return;

    try {
      await resolveAdminAppeal(appealId, action);
      alert('Xử lý khiếu nại thành công.');
      fetchAlertsAndAppeals();
      if (activeTab === 'users') fetchUsersData();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 text-slate-100 shadow-2xl font-sans min-h-[70vh] flex flex-col space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-550/30 rounded-2xl text-amber-500">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-100">Bảng Điều Khiển Quản Trị</h2>
            <p className="text-xs text-slate-400">
              Quyền hạn: <span className="font-extrabold text-amber-450 uppercase">{currentUser.role === 'admin' ? 'Administrator' : 'Co-Administrator'}</span>
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-amber-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Tổng Quan
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-amber-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Thành Viên
          </button>
          <button
            onClick={() => setActiveTab('calculations')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'calculations' ? 'bg-amber-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Dịch Bản / Lá Số
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${activeTab === 'alerts' ? 'bg-amber-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Cảnh Báo & Khiếu Nại
            {(alerts.filter(a => a.status === 'unread').length > 0 || appeals.length > 0) && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white animate-pulse">
                {alerts.filter(a => a.status === 'unread').length + appeals.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}

      {/* 1. OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* STATS OVERVIEW CARDS */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
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
                <span className="text-2xl sm:text-3xl font-extrabold mt-2 font-serif text-purple-500">{analytics.overview.totalTuvi}</span>
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
                onClick={() => setActiveTab('alerts')}
                className="bg-red-800 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs tracking-wider transition-colors shrink-0"
              >
                XỬ LÝ NGAY
              </button>
            </div>
          )}

          {/* RECHARTS TIMELINE GRAPHICS */}
          <div className="bg-slate-950/40 border border-slate-800 p-4 sm:p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold flex items-center gap-2">
                  <TrendingUp size={20} className="text-amber-500" />
                  Biểu Đồ Hoạt Động Hệ Thống
                </h3>
                <p className="text-xs text-slate-400">Thống kê lưu lượng, dịch lý và mức tiêu thụ Token AI</p>
              </div>

              {/* Time Range Filter Buttons */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                {[7, 30, 90].map(days => (
                  <button
                    key={days}
                    onClick={() => setTimeRange(days)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === days ? 'bg-amber-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {days} Ngày
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-72 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
              </div>
            ) : analytics && analytics.timeline && analytics.timeline.length > 0 ? (
              <div className="space-y-8">
                {/* Visits & Interpretation Chart */}
                <div className="h-72 w-full">
                  <span className="text-xs text-slate-400 font-bold block mb-2">1. Lượt truy cập (Visit Logs) & Lượt dịch lý (AI Interpretations)</span>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.timeline}>
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
                      <Area name="Bát Tự" type="monotone" dataKey="bazi" stroke="#3b82f6" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
                      <Area name="Tử Vi" type="monotone" dataKey="tuvi" stroke="#a855f7" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Token Usage Chart */}
                <div className="h-64 w-full">
                  <span className="text-xs text-slate-400 font-bold block mb-2 text-purple-400">2. Số Token AI Tiêu Thụ Hàng Ngày</span>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <ChartTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                      <Bar name="Token AI" dataKey="tokens" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
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

            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
              </div>
            ) : analytics && analytics.userConsumption && analytics.userConsumption.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="pb-3 pr-2">Hội Viên</th>
                      <th className="pb-3 text-center">Token AI</th>
                      <th className="pb-3 text-center">Kinh Dịch</th>
                      <th className="pb-3 text-center">Bát Tự</th>
                      <th className="pb-3 text-center">Tử Vi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {analytics.userConsumption.map((uc, index) => (
                      <tr key={index} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="font-semibold text-slate-200">{uc.name}</div>
                          <div className="text-[11px] text-slate-550">{uc.email}</div>
                        </td>
                        <td className="py-3.5 text-center font-extrabold text-purple-400">
                          {uc.tokens.toLocaleString()}
                        </td>
                        <td className="py-3.5 text-center text-slate-300">{uc.iching}</td>
                        <td className="py-3.5 text-center text-slate-300">{uc.bazi}</td>
                        <td className="py-3.5 text-center text-slate-300">{uc.tuvi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">
                Chưa có dữ liệu tiêu thụ tài nguyên của hội viên.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* SEARCH & FILTER CONTROLS */}
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsersData()}
                placeholder="Tìm tên hoặc email..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-200"
              />
              <Search className="absolute left-3.5 top-2.5 text-slate-500" size={16} />
            </div>

            <div className="flex flex-wrap w-full md:w-auto gap-2 items-center">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                <Filter size={14} />
                Lọc:
              </div>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Mọi vai trò --</option>
                <option value="user">User</option>
                <option value="vip">Vip</option>
                <option value="co-admin">Co-Admin</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Mọi trạng thái --</option>
                <option value="active">Hoạt động</option>
                <option value="locked">Bị Khóa</option>
                <option value="deleted">Đã Xóa</option>
              </select>
              <button
                onClick={() => {
                  setUserPage(1);
                  fetchUsersData();
                }}
                className="bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                ÁP DỤNG
              </button>
            </div>
          </div>

          {/* USER TABLE GRID */}
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
          ) : users.length > 0 ? (
            <div className="bg-slate-950/20 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-4 px-4">Thành Viên</th>
                      <th className="py-4 px-3 text-center">Vai Trò</th>
                      <th className="py-4 px-3 text-center">Credit</th>
                      <th className="py-4 px-3 text-center">Trạng Thái</th>
                      <th className="py-4 px-4 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {users.map((u) => {
                      const managed = canManage(u);
                      return (
                        <tr key={u._id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-200">{u.name}</div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                            {u.phone && <div className="text-[10px] text-slate-400 mt-0.5">SĐT: {u.phone}</div>}
                          </td>
                          <td className="py-4 px-3 text-center">
                            {managed ? (
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-2 py-1 text-slate-350 focus:outline-none focus:border-amber-500 font-semibold"
                              >
                                <option value="user">User</option>
                                <option value="vip">Vip</option>
                                <option value="co-admin">Co-Admin</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className="font-extrabold uppercase text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {u.role}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-mono font-bold text-amber-500 text-sm">{u.credits}</span>
                              {managed && (
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setCreditChange('');
                                    setCreditMode('add');
                                  }}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-500 transition-colors"
                                  title="Điều chỉnh Credit"
                                >
                                  <Coins size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            {u.isDeleted ? (
                              <span className="text-[10px] uppercase font-extrabold bg-red-950/60 text-red-500 border border-red-900/40 px-2 py-0.5 rounded">
                                Đã xóa
                              </span>
                            ) : u.status === 'locked' ? (
                              <span
                                className="text-[10px] uppercase font-extrabold bg-amber-955/60 text-amber-500 border border-amber-900/40 px-2 py-0.5 rounded cursor-help"
                                title={`Lý do: ${u.lockReason || 'Không có lý do'}`}
                              >
                                Bị Khóa
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-extrabold bg-emerald-950/60 text-emerald-500 border border-emerald-900/40 px-2 py-0.5 rounded">
                                Hoạt động
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {managed && !u.isDeleted && (
                                <>
                                  {u.status === 'locked' ? (
                                    <button
                                      onClick={() => handleUnlockUser(u)}
                                      className="p-1.5 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-500 border border-slate-800 hover:border-emerald-900/40 rounded-lg transition-all"
                                      title="Mở khóa tài khoản"
                                    >
                                      <Unlock size={14} />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedUser(u);
                                        setLockReason('');
                                        setIsLockModalOpen(true);
                                      }}
                                      className="p-1.5 hover:bg-amber-950/60 text-slate-400 hover:text-amber-500 border border-slate-800 hover:border-amber-900/40 rounded-lg transition-all"
                                      title="Khóa tài khoản"
                                    >
                                      <Lock size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1.5 hover:bg-red-950/60 text-slate-400 hover:text-red-550 border border-slate-800 hover:border-red-900/40 rounded-lg transition-all"
                                    title="Xóa tài khoản (Xóa mềm)"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                              {!managed && (
                                <span className="text-xs text-slate-500 italic">Không có quyền</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              <div className="bg-slate-950/60 border-t border-slate-850 px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Hiển thị <span className="font-bold text-slate-200">{users.length}</span> / <span className="font-bold text-slate-200">{userTotal}</span> hội viên
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={userPage <= 1 || loading}
                    onClick={() => setUserPage(p => p - 1)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-300 px-2">Trang {userPage}</span>
                  <button
                    disabled={userPage * userLimit >= userTotal || loading}
                    onClick={() => setUserPage(p => p + 1)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/10 border border-slate-800 rounded-3xl py-16 text-center text-slate-500 font-semibold text-sm">
              Không tìm thấy thành viên phù hợp với bộ lọc tìm kiếm.
            </div>
          )}

          {/* CREDIT ADJUSTMENT MODAL SUB-INTERFACE */}
          {selectedUser && !isLockModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
                >
                  <X size={20} />
                </button>
                <h3 className="text-lg font-serif font-bold text-amber-500 flex items-center gap-2">
                  <Coins size={20} />
                  Chỉnh Sửa Lượt Sử Dụng (Credits)
                </h3>
                <p className="text-xs text-slate-400">
                  Tài khoản: <span className="font-bold text-slate-250">{selectedUser.name}</span> ({selectedUser.email})<br />
                  Số credit hiện tại: <span className="font-extrabold text-amber-450">{selectedUser.credits}</span>
                </p>

                <form onSubmit={handleUpdateCreditsSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-350 mb-1.5 uppercase">Chế độ sửa</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                      {[
                        { label: 'Cộng thêm', value: 'add' },
                        { label: 'Trừ bớt', value: 'subtract' },
                        { label: 'Thiết lập', value: 'set' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCreditMode(opt.value)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${creditMode === opt.value ? 'bg-amber-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-350 mb-1">Số lượt credit</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={creditChange}
                      onChange={(e) => setCreditChange(e.target.value)}
                      placeholder="Nhập số lượng credit..."
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-200 focus:ring-0"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-850 hover:bg-amber-800 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    Lưu Thay Đổi
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SUSPENSION REASON LOCK MODAL */}
          {selectedUser && isLockModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsLockModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
                >
                  <X size={20} />
                </button>
                <h3 className="text-lg font-serif font-bold text-red-500 flex items-center gap-2">
                  <Lock size={18} />
                  Khóa Tài Khoản Thành Viên
                </h3>
                <p className="text-xs text-slate-400">
                  Tài khoản bị khóa: <span className="font-bold text-slate-200">{selectedUser.name}</span> ({selectedUser.email})
                </p>

                <form onSubmit={handleLockUserSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-350 mb-1">Lý do đình chỉ tài khoản</label>
                    <textarea
                      required
                      rows={3}
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                      placeholder="Nhập lý do cụ thể để người dùng biết khi đăng nhập..."
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-red-500 text-slate-200 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    {['Spam dữ liệu quẻ', 'Vi phạm điều khoản sử dụng', 'Khai thác lỗ hổng hệ thống'].map(pre => (
                      <button
                        key={pre}
                        type="button"
                        onClick={() => setLockReason(pre)}
                        className="px-2.5 py-1 bg-slate-955 border border-slate-800 rounded-lg text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      >
                        {pre}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-800 hover:bg-red-750 text-white font-bold py-3 rounded-xl transition-colors text-sm mt-2"
                  >
                    Xác Nhận Khóa
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. CALCULATION RECORD MODERATION */}
      {activeTab === 'calculations' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* TAB CATEGORIES (Iching, Bazi, Tuvi) */}
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 gap-1 w-full sm:w-80">
            {[
              { id: 'iching', name: 'Kinh Dịch' },
              { id: 'bazi', name: 'Bát Tự' },
              { id: 'tuvi', name: 'Tử Vi' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setCalcType(tab.id);
                  setCalcPage(1);
                  setCalculations([]);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap text-center ${calcType === tab.id ? 'bg-amber-800 text-white shadow-md' : 'text-slate-450 hover:text-slate-200'}`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* SEARCH & FILTERS FOR CALCS */}
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={calcSearch}
                onChange={(e) => setCalcSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCalculationsData()}
                placeholder={calcType === 'iching' ? 'Tìm theo userId hoặc Ý niệm...' : 'Tìm theo userId...'}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-200"
              />
              <Search className="absolute left-3.5 top-2.5 text-slate-500" size={16} />
            </div>

            <div className="flex gap-2 items-center w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                <Filter size={14} />
                Trạng thái:
              </div>
              <select
                value={calcStatusFilter}
                onChange={(e) => setCalcStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Mọi trạng thái --</option>
                <option value="active">Hoạt động</option>
                <option value="locked">Bị Khóa</option>
                <option value="deleted">Đã Xóa</option>
              </select>
              <button
                onClick={() => {
                  setCalcPage(1);
                  fetchCalculationsData();
                }}
                className="bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                ÁP DỤNG
              </button>
            </div>
          </div>

          {/* CALCULATION DATA TABLE */}
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
          ) : calculations.length > 0 ? (
            <div className="bg-slate-950/20 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-4 px-4">Tài Khoản Gieo</th>
                      <th className="py-4 px-3">
                        {calcType === 'iching' ? 'Ý niệm / Câu hỏi' : calcType === 'bazi' ? 'Giới Tính & Ngày Sinh' : 'Thông Tin Sinh'}
                      </th>
                      <th className="py-4 px-3 text-center">Thời gian</th>
                      <th className="py-4 px-3 text-center">Trạng thái</th>
                      <th className="py-4 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {calculations.map((calc) => (
                      <tr key={calc._id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-200">{calc.user?.name || 'Khách'}</div>
                          <div className="text-[11px] text-slate-500 font-semibold">{calc.user?.email || 'guest'}</div>
                          <div className="text-[10px] text-slate-450 mt-0.5">ID: {calc.userId}</div>
                        </td>
                        <td className="py-4 px-3 max-w-xs truncate">
                          {calcType === 'iching' && (
                            <div className="font-medium text-amber-500 italic" title={calc.question}>
                              "{calc.question || 'Không có câu hỏi'}"
                            </div>
                          )}
                          {calcType === 'bazi' && calc.baziData && (
                            <div className="text-slate-300">
                              Giới tính: <span className="font-bold text-slate-100">{calc.baziData.gender === 1 ? 'Nam' : 'Nữ'}</span><br />
                              <span className="text-[11px] text-slate-450">Sinh: {calc.baziData.solarDate} ({calc.baziData.solarTime})</span>
                            </div>
                          )}
                          {calcType === 'tuvi' && (
                            <div className="text-slate-300">
                              Giới tính: <span className="font-bold text-slate-100">{calc.gender === 1 ? 'Nam' : 'Nữ'}</span><br />
                              <span className="text-[11px] text-slate-450">Sinh: {calc.date} ({calc.hour} giờ)</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-3 text-center text-[11px] text-slate-450">
                          {new Date(calc.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-4 px-3 text-center">
                          {calc.isDeleted ? (
                            <span className="text-[10px] uppercase font-extrabold bg-red-950/60 text-red-500 border border-red-900/40 px-2 py-0.5 rounded">
                              Đã xóa
                            </span>
                          ) : calc.status === 'locked' ? (
                            <span className="text-[10px] uppercase font-extrabold bg-amber-955/60 text-amber-500 border border-amber-900/40 px-2 py-0.5 rounded">
                              Bị Khóa
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-extrabold bg-emerald-950/60 text-emerald-500 border border-emerald-900/40 px-2 py-0.5 rounded">
                              Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedCalc(calc)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-550 border border-slate-800 rounded-lg transition-all"
                              title="Xem chi tiết kết quả luận giải"
                            >
                              <Eye size={14} />
                            </button>
                            {!calc.isDeleted && (
                              <>
                                <button
                                  onClick={() => handleLockCalculation(calc)}
                                  className={`p-1.5 rounded-lg border border-slate-800 transition-all ${calc.status === 'locked' ? 'hover:bg-emerald-950/60 text-emerald-500 hover:border-emerald-900/40' : 'hover:bg-amber-955/60 text-slate-400 hover:text-amber-500 hover:border-amber-900/40'}`}
                                  title={calc.status === 'locked' ? 'Mở khóa bản ghi' : 'Khóa bản ghi'}
                                >
                                  {calc.status === 'locked' ? <Unlock size={14} /> : <Lock size={14} />}
                                </button>
                                <button
                                  onClick={() => handleDeleteCalculation(calc)}
                                  className="p-1.5 hover:bg-red-950/60 text-slate-400 hover:text-red-550 border border-slate-800 hover:border-red-900/40 rounded-lg transition-all"
                                  title="Xóa mềm bản ghi"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              <div className="bg-slate-950/60 border-t border-slate-850 px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Hiển thị <span className="font-bold text-slate-200">{calculations.length}</span> / <span className="font-bold text-slate-200">{calcTotal}</span> bản ghi
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={calcPage <= 1 || loading}
                    onClick={() => setCalcPage(p => p - 1)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-300 px-2">Trang {calcPage}</span>
                  <button
                    disabled={calcPage * calcLimit >= calcTotal || loading}
                    onClick={() => setCalcPage(p => p + 1)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/10 border border-slate-800 rounded-3xl py-16 text-center text-slate-500 font-semibold text-sm">
              Không tìm thấy bản ghi luận giải nào.
            </div>
          )}

          {/* CALCULATION RECORD DETAIL VIEW MODAL */}
          {selectedCalc && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] p-6 relative shadow-2xl flex flex-col space-y-4">
                <button
                  type="button"
                  onClick={() => setSelectedCalc(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
                >
                  <X size={22} />
                </button>
                
                <h3 className="text-lg font-serif font-bold text-amber-500 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Info size={20} />
                  Chi Tiết Bản Ghi Luận Giải {calcType === 'iching' ? 'Kinh Dịch' : calcType === 'bazi' ? 'Bát Tự' : 'Tử Vi'}
                </h3>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-slate-350 text-xs sm:text-sm">
                  
                  {/* General Metadata Info */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-[11px] sm:text-xs">
                    <div>
                      <span className="text-slate-500 block">Người dùng gieo:</span>
                      <strong className="text-slate-200">{selectedCalc.user?.name || 'Khách vãng lai'}</strong> ({selectedCalc.user?.email || 'guest'})
                    </div>
                    <div>
                      <span className="text-slate-500 block">Thời gian tạo:</span>
                      <strong className="text-slate-200">{new Date(selectedCalc.createdAt).toLocaleString('vi-VN')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ID Bản ghi:</span>
                      <span className="font-mono text-slate-400">{selectedCalc._id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Trạng thái dữ liệu:</span>
                      <strong className={selectedCalc.status === 'locked' ? 'text-amber-500' : 'text-emerald-500'}>
                        {selectedCalc.isDeleted ? 'Đã Xóa (Mềm)' : selectedCalc.status === 'locked' ? 'Bị Khóa' : 'Hoạt động'}
                      </strong>
                    </div>
                  </div>

                  {/* Iching Details */}
                  {calcType === 'iching' && (
                    <div className="space-y-4">
                      <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850">
                        <span className="text-slate-450 block font-bold text-xs mb-1 uppercase tracking-wider">Câu hỏi/Ý niệm:</span>
                        <p className="text-slate-100 font-bold italic font-serif text-sm">"{selectedCalc.question || 'Không có câu hỏi'}"</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/35 p-3.5 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block font-bold text-xs mb-1 uppercase tracking-wider">Quẻ Chủ (Trụ):</span>
                          <strong className="text-amber-450 text-sm">{selectedCalc.primary?.name || 'Chưa định quẻ'}</strong>
                          <span className="text-[11px] block text-slate-500 mt-0.5">{selectedCalc.primary?.symbol} ({selectedCalc.primary?.group})</span>
                        </div>
                        <div className="bg-slate-950/35 p-3.5 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block font-bold text-xs mb-1 uppercase tracking-wider">Quẻ Hào Biến:</span>
                          {selectedCalc.secondary ? (
                            <>
                              <strong className="text-amber-450 text-sm">{selectedCalc.secondary.name}</strong>
                              <span className="text-[11px] block text-slate-500 mt-0.5">{selectedCalc.secondary.symbol} ({selectedCalc.secondary.group})</span>
                            </>
                          ) : (
                            <span className="text-slate-500 italic block text-xs mt-1">Không có Hào biến (Quẻ Tĩnh)</span>
                          )}
                        </div>
                      </div>

                      {/* Ứng kỳ list */}
                      {selectedCalc.primary?.ungKy && selectedCalc.primary.ungKy.length > 0 && (
                        <div className="bg-slate-950/35 p-4 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block font-bold text-xs mb-2 uppercase tracking-wider">Thời gian Ứng Kỳ gợi ý:</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedCalc.primary.ungKy.map((uk, idx) => (
                              <span key={idx} className="bg-amber-950/60 border border-amber-900/40 text-amber-500 px-3 py-1 rounded-lg text-xs font-bold">
                                {uk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bazi Details */}
                  {calcType === 'bazi' && selectedCalc.baziData && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Can Chi Năm:</span>
                          <strong className="text-slate-100">{selectedCalc.baziData.fourPillars?.year || 'Chưa định'}</strong>
                        </div>
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Can Chi Tháng:</span>
                          <strong className="text-slate-100">{selectedCalc.baziData.fourPillars?.month || 'Chưa định'}</strong>
                        </div>
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Can Chi Ngày:</span>
                          <strong className="text-slate-100">{selectedCalc.baziData.fourPillars?.day || 'Chưa định'}</strong>
                        </div>
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Can Chi Giờ:</span>
                          <strong className="text-slate-100">{selectedCalc.baziData.fourPillars?.hour || 'Chưa định'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tuvi Details */}
                  {calcType === 'tuvi' && (
                    <div className="space-y-4 bg-slate-950/35 p-4 rounded-xl border border-slate-850">
                      <span className="text-slate-450 block font-bold text-xs mb-2 uppercase tracking-wider">Dữ liệu tính toán Tử Vi:</span>
                      <div className="grid grid-cols-2 gap-3 text-slate-300">
                        <div>Ngày sinh Dương Lịch: <strong className="text-slate-100">{selectedCalc.date}</strong></div>
                        <div>Giờ sinh Dương Lịch: <strong className="text-slate-100">{selectedCalc.hour} giờ</strong></div>
                        <div>Giới tính: <strong className="text-slate-100">{selectedCalc.gender === 1 ? 'Nam' : 'Nữ'}</strong></div>
                        <div>Trạng thái Job ID Tử Vi: <span className="font-mono text-slate-400">{selectedCalc.tuviJobId || 'N/A'}</span></div>
                      </div>
                    </div>
                  )}

                  {/* AI Interpretation */}
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-purple-400 block font-extrabold text-xs uppercase tracking-widest">Kết quả Luận Giải AI:</span>
                    {selectedCalc.aiInterpretation ? (
                      <div className="whitespace-pre-line text-slate-200 leading-relaxed font-sans text-xs sm:text-sm bg-slate-900/30 p-3 rounded-xl max-h-60 overflow-y-auto border border-slate-850">
                        {selectedCalc.aiInterpretation}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic block text-xs">Người dùng chưa thực hiện luận giải bằng trí tuệ nhân tạo (Hoặc chưa tiêu thụ Credit).</span>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 4. WARNINGS & APPEALS */}
      {activeTab === 'alerts' && (
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
                        className="self-end bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-slate-100 font-semibold px-3 py-1 rounded-lg text-[10px] transition-colors"
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
              <p className="text-xs text-slate-400">Yêu cầu xem xét mở khóa tài khoản do người dùng gửi lên</p>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {appeals.length > 0 ? (
                appeals.map((ap) => (
                  <div
                    key={ap._id}
                    className="p-4 rounded-xl border bg-slate-950/40 border-slate-800 text-xs space-y-3"
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">Email: {ap.email}</span>
                        <span className="text-[10px] font-mono text-slate-500">ID: {ap.userId}</span>
                      </div>
                      <div className="text-[11px] text-red-400 font-semibold mt-1">Lý do khóa: "{ap.reason}"</div>
                    </div>

                    <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850 text-slate-300 italic text-[11px]">
                      "{ap.message}"
                    </div>

                    <div className="text-[10px] text-slate-500 block">Thời gian gửi: {new Date(ap.createdAt).toLocaleString('vi-VN')}</div>

                    <div className="flex items-center gap-2 justify-end pt-1">
                      <button
                        onClick={() => handleResolveAppeal(ap._id, 'approve')}
                        className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors flex items-center gap-1"
                      >
                        <Check size={12} />
                        Mở Khóa
                      </button>
                      <button
                        onClick={() => handleResolveAppeal(ap._id, 'reject')}
                        className="bg-red-800/80 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors flex items-center gap-1"
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
      )}

    </div>
  );
}

import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { AuthContext } from '@/context/AuthContext';
import AdminConfirmModal from '@/components/modals/AdminConfirmModal';
import AdminUserStatsModal from '@/features/admin/components/AdminUserStatsModal';
import AdminOverviewTab from '@/features/admin/tabs/AdminOverviewTab';
import AdminUsersTab from '@/features/admin/tabs/AdminUsersTab';
import AdminCalculationsTab from '@/features/admin/tabs/AdminCalculationsTab';
import AdminAlertsTab from '@/features/admin/tabs/AdminAlertsTab';
import AdminBlogTab from '@/features/admin/tabs/AdminBlogTab';
import AdminConfigTab from '@/features/admin/tabs/AdminConfigTab';
import AdminSystemTab from '@/features/admin/tabs/AdminSystemTab';
import AdminDlqModal from '@/features/admin/components/AdminDlqModal';
import { AdminThemeProvider, useAdminTheme } from '@/features/admin/context/AdminThemeContext';
import AdminThemeToggle from '@/features/admin/context/AdminThemeToggle';
import {
  getAdminAnalytics,
  getAdminNotifications,
  getAdminUserStats,
  getSystemHealthDetailed,
  getAdminQueueStatus,
  retryAdminDlqJob,
  clearAdminDlq
} from '@/services/api';
import {
  Shield,
  LogOut,
  LayoutDashboard,
  Users,
  Layers,
  AlertTriangle,
  BookOpen,
  Sliders,
  ExternalLink,
  Activity
} from 'lucide-react';

export function AdminAppInner({ onSwitchToUser }) {
  const { isLight } = useAdminTheme();
  const { user: currentUser, token, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'calculations' | 'alerts' | 'blog' | 'config' | 'system'

  // Custom Notifications / Confirm Modal State
  const [notification, setNotification] = useState(null);

  const showAlert = useCallback((message, type = 'success') => {
    setNotification({ type, message });
  }, []);

  const showConfirm = useCallback((message, onConfirm) => {
    setNotification({ type: 'confirm', message, onConfirm });
  }, []);

  // Custom Date Filters for Analytics
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState('day');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [tokenChartMetric, setTokenChartMetric] = useState('subject');

  // Warnings / Appeals
  const [alerts, setAlerts] = useState([]);
  const [appeals, setAppeals] = useState([]);

  // User details stats modal state
  const [userStats, setUserStats] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // System Health & Queue Monitoring
  const [health, setHealth] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [dlqJobs, setDlqJobs] = useState([]);
  const [isDlqModalOpen, setIsDlqModalOpen] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);

  // Navigation filter to users tab
  const [initialUserSearch, setInitialUserSearch] = useState('');

  // Live real-time badges & refresh triggers
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [newCalcsCount, setNewCalcsCount] = useState(0);
  const [newIchingCount, setNewIchingCount] = useState(0);
  const [newBaziCount, setNewBaziCount] = useState(0);
  const [newZiweiCount, setNewZiweiCount] = useState(0);
  const [newMarriageCount, setNewMarriageCount] = useState(0);

  const [usersRefreshTrigger, setUsersRefreshTrigger] = useState(0);
  const [calcsRefreshTrigger, setCalcsRefreshTrigger] = useState(null);

  const isFetchingAnalytics = useRef(false);
  const isAnalyticsDirty = useRef(true);
  const lastFetchedAnalyticsParams = useRef({ startDate: null, endDate: null, groupBy: null });

  // Dynamic state refs for SSE stability
  const activeTabRef = useRef(activeTab);
  const isStatsModalOpenRef = useRef(isStatsModalOpen);
  const userStatsRef = useRef(userStats);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { isStatsModalOpenRef.current = isStatsModalOpen; }, [isStatsModalOpen]);
  useEffect(() => { userStatsRef.current = userStats; }, [userStats]);

  // Clear badges when active tab is selected
  useEffect(() => {
    if (activeTab === 'users') {
      setNewUsersCount(0);
    } else if (activeTab === 'calculations') {
      setNewCalcsCount(0);
    }
  }, [activeTab]);

  const fetchAlertsAndAppeals = useCallback(async () => {
    try {
      const res = await getAdminNotifications();
      setAlerts(res.data.alerts || []);
      setAppeals(res.data.appeals || []);
    } catch (err) {
      console.error('Lỗi tải cảnh báo/khiếu nại:', err);
    }
  }, []);

  const fetchHealthAndQueue = useCallback(async () => {
    setHealthLoading(true);
    try {
      const [healthRes, queueRes] = await Promise.allSettled([
        getSystemHealthDetailed(),
        getAdminQueueStatus(50)
      ]);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (queueRes.status === 'fulfilled') {
        setQueueStatus(queueRes.value.data);
        setDlqJobs(queueRes.value.data?.dlqJobs || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải thông số sức khỏe hệ thống:', err);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const handleRetryDlqJob = async (jobId) => {
    try {
      await retryAdminDlqJob(jobId);
      showAlert('Đã đẩy tác vụ trở lại hàng đợi thành công!', 'success');
      fetchHealthAndQueue();
    } catch (err) {
      showAlert(err.response?.data?.error || 'Có lỗi xảy ra khi thử lại tác vụ.', 'error');
    }
  };

  const handleClearDlq = () => {
    showConfirm('Bạn có chắc chắn muốn xóa sạch toàn bộ hàng đợi thư lỗi DLQ? Hành động này không thể hoàn tác.', async () => {
      try {
        await clearAdminDlq();
        showAlert('Đã dọn sạch hàng đợi thư lỗi (DLQ)!', 'success');
        fetchHealthAndQueue();
      } catch (err) {
        showAlert(err.response?.data?.error || 'Có lỗi xảy ra khi dọn hàng đợi thư lỗi.', 'error');
      }
    });
  };

  const fetchAnalyticsData = useCallback(async () => {
    if (isFetchingAnalytics.current) return;
    isFetchingAnalytics.current = true;
    setAnalyticsLoading(true);
    try {
      const res = await getAdminAnalytics(startDate, endDate, groupBy);
      setAnalytics(res.data);
      lastFetchedAnalyticsParams.current = { startDate, endDate, groupBy };
      isAnalyticsDirty.current = false;
    } catch (err) {
      console.error('Lỗi tải dữ liệu analytics:', err);
      showAlert(err.response?.data?.error || 'Lỗi khi tải dữ liệu phân tích hệ thống.', 'error');
    } finally {
      setAnalyticsLoading(false);
      isFetchingAnalytics.current = false;
    }
  }, [startDate, endDate, groupBy, showAlert]);

  useEffect(() => {
    const paramsChanged =
      lastFetchedAnalyticsParams.current.startDate !== startDate ||
      lastFetchedAnalyticsParams.current.endDate !== endDate ||
      lastFetchedAnalyticsParams.current.groupBy !== groupBy;

    if (activeTab === 'overview') {
      if (paramsChanged || isAnalyticsDirty.current) {
        fetchAnalyticsData();
      }
    }
  }, [activeTab, startDate, endDate, groupBy, fetchAnalyticsData]);

  useEffect(() => {
    fetchAlertsAndAppeals();
    fetchHealthAndQueue();
  }, [fetchAlertsAndAppeals, fetchHealthAndQueue]);

  const handlePresetClick = (days) => {
    const now = Date.now();
    const start = new Date(now - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = new Date(now).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  };

  const handleUserClick = useCallback(async (userId) => {
    try {
      const res = await getAdminUserStats(userId);
      setUserStats(res.data);
      setIsStatsModalOpen(true);
    } catch (err) {
      console.error('Lỗi khi tải thống kê người dùng:', err);
      showAlert(err.response?.data?.error || 'Không thể tải chi tiết người dùng.', 'error');
    }
  }, [showAlert]);

  const handleGoToUser = (userId) => {
    setInitialUserSearch(userId);
    setActiveTab('users');
  };

  // SSE Admin Event Source
  useEffect(() => {
    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const sseUrl = `${API_URL}/admin/events`;

    const eventSource = new EventSourcePolyfill(sseUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      heartbeatTimeout: 45000
    });

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'new_notification') {
          const notificationData = payload.data;
          if (notificationData.type === 'appeal') {
            const reconstructedAppeal = {
              _id: notificationData.metadata?.appealId || notificationData._id,
              userId: notificationData.metadata?.userId || '',
              email: notificationData.metadata?.email || '',
              reason: notificationData.metadata?.reason || 'Vi phạm chính sách hệ thống',
              message: notificationData.metadata?.message || '',
              createdAt: notificationData.createdAt || new Date().toISOString()
            };
            setAppeals(prev => [reconstructedAppeal, ...prev]);
          } else {
            setAlerts(prev => [notificationData, ...prev]);
          }
          if (activeTabRef.current === 'overview') {
            fetchAnalyticsData();
          } else {
            isAnalyticsDirty.current = true;
          }
        } else if (payload.type === 'new_user') {
          setUsersRefreshTrigger(Date.now());
          if (activeTabRef.current !== 'users') {
            setNewUsersCount(prev => prev + 1);
          }
          if (activeTabRef.current === 'overview') {
            fetchAnalyticsData();
          } else {
            isAnalyticsDirty.current = true;
          }
        } else if (payload.type === 'new_calculation') {
          const calcTypeReceived = payload.data?.type;
          setCalcsRefreshTrigger({ type: calcTypeReceived, timestamp: Date.now() });

          if (activeTabRef.current !== 'calculations') {
            setNewCalcsCount(prev => prev + 1);
            if (calcTypeReceived === 'iching') setNewIchingCount(prev => prev + 1);
            else if (calcTypeReceived === 'bazi') setNewBaziCount(prev => prev + 1);
            else if (calcTypeReceived === 'ziwei') setNewZiweiCount(prev => prev + 1);
            else if (calcTypeReceived === 'marriage') setNewMarriageCount(prev => prev + 1);
          } else {
            if (calcTypeReceived === 'iching') setNewIchingCount(prev => prev + 1);
            else if (calcTypeReceived === 'bazi') setNewBaziCount(prev => prev + 1);
            else if (calcTypeReceived === 'ziwei') setNewZiweiCount(prev => prev + 1);
            else if (calcTypeReceived === 'marriage') setNewMarriageCount(prev => prev + 1);
          }

          if (activeTabRef.current === 'overview') {
            fetchAnalyticsData();
          } else {
            isAnalyticsDirty.current = true;
          }
        } else if (payload.type === 'user_updated') {
          if (payload.data?.action !== 'stats') {
            setUsersRefreshTrigger(Date.now());
          }
          if (activeTabRef.current === 'overview') {
            fetchAnalyticsData();
          } else {
            isAnalyticsDirty.current = true;
          }
          const currentStats = userStatsRef.current;
          if (isStatsModalOpenRef.current && currentStats && (currentStats.user?._id === payload.data.userId || currentStats.user?.id === payload.data.userId)) {
            handleUserClick(payload.data.userId);
          }
        }
      } catch (err) {
        console.error('[SSE] Error processing admin event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] Admin connection error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [token, fetchAnalyticsData, handleUserClick]);

  return (
    <div className={`border rounded-3xl p-4 sm:p-7 shadow-xl font-sans min-h-[70vh] flex flex-col space-y-6 transition-all duration-200 ${
      isLight
        ? 'bg-slate-50/70 border-slate-200 text-slate-800'
        : 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl'
    }`}>
      
      {/* ========================================================
          HEADER BAR - TẦNG 1: BRAND IDENTITY & GLOBAL CONTROLS
          ======================================================== */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b transition-colors ${
        isLight ? 'border-slate-200/80' : 'border-slate-800'
      }`}>
        {/* BRAND IDENTITY */}
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
            isLight
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
          }`}>
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className={`text-xl sm:text-2xl font-bold font-serif whitespace-nowrap transition-colors ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                Bảng Điều Khiển Quản Trị
              </h2>
              {currentUser?.role && (
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wider transition-colors ${
                  currentUser.role === 'admin'
                    ? (isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/15 text-amber-400 border-amber-500/30')
                    : (isLight ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-blue-500/15 text-blue-400 border-blue-500/30')
                }`}>
                  {currentUser.role === 'admin' ? 'Administrator' : 'Co-Administrator'}
                </span>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Hệ thống giám sát vận hành, người dùng & điều phối trí tuệ nhân tạo
            </p>
          </div>
        </div>

        {/* GLOBAL CONTROLS (THEME SWITCHER + APP SWITCHER + LOGOUT) */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* THEME TOGGLE (LIGHT / DARK) */}
          <AdminThemeToggle />

          {/* APP SWITCHER (ADMIN APP <-> USER APP) */}
          <div className={`inline-flex items-center p-1 rounded-xl border transition-colors ${
            isLight ? 'bg-slate-200/80 border-slate-300/80 shadow-2xs' : 'bg-slate-950 border-slate-800'
          }`}>
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isLight ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90' : 'bg-amber-600 text-white shadow-md'
              }`}
            >
              Quản Trị
            </span>
            <button
              type="button"
              onClick={onSwitchToUser}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Chuyển về giao diện người dùng"
            >
              <span>Xem Web</span>
              <ExternalLink size={12} className="opacity-70" />
            </button>
          </div>

          {/* LOGOUT BUTTON */}
          <button
            type="button"
            onClick={async () => {
              try {
                localStorage.setItem('adminMode', 'false');
                localStorage.removeItem('adminMode');
              } catch (e) {}
              if (onSwitchToUser) onSwitchToUser();
              await logout();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all border cursor-pointer shrink-0 shadow-2xs ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/90'
                : 'bg-red-950/40 hover:bg-red-900/40 text-red-400 border-red-900/30'
            }`}
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          HEADER BAR - TẦNG 2: NAVIGATION TABS BAR (REDESIGNED)
          ======================================================== */}
      <div className={`p-1.5 rounded-2xl border transition-all overflow-x-auto ${
        isLight
          ? 'bg-slate-100/90 border-slate-200/80 shadow-inner'
          : 'bg-slate-950/80 border-slate-800/80'
      }`}>
        <div className="flex items-center gap-1.5 min-w-max">
          {/* TAB TỔNG QUAN */}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? (isLight ? 'bg-white text-slate-950 shadow-md shadow-slate-200/60 border border-slate-200/90' : 'bg-amber-600 text-white shadow-lg')
                : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50')
            }`}
          >
            <LayoutDashboard size={16} className={activeTab === 'overview' ? (isLight ? 'text-amber-600' : 'text-amber-200') : 'opacity-70'} />
            <span>Tổng Quan</span>
          </button>

          {/* TAB THÀNH VIÊN */}
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'users'
                ? (isLight ? 'bg-white text-slate-950 shadow-md shadow-slate-200/60 border border-slate-200/90' : 'bg-amber-600 text-white shadow-lg')
                : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50')
            }`}
          >
            <Users size={16} className={activeTab === 'users' ? (isLight ? 'text-amber-600' : 'text-amber-200') : 'opacity-70'} />
            <span>Thành Viên</span>
            {newUsersCount > 0 && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-extrabold text-white animate-pulse shadow-xs">
                {newUsersCount}
              </span>
            )}
          </button>

          {/* TAB DỊCH BẢN / LÁ SỐ */}
          <button
            type="button"
            onClick={() => setActiveTab('calculations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'calculations'
                ? (isLight ? 'bg-white text-slate-950 shadow-md shadow-slate-200/60 border border-slate-200/90' : 'bg-amber-600 text-white shadow-lg')
                : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50')
            }`}
          >
            <Layers size={16} className={activeTab === 'calculations' ? (isLight ? 'text-amber-600' : 'text-amber-200') : 'opacity-70'} />
            <span>Dịch Bản / Lá Số</span>
            {newCalcsCount > 0 && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-extrabold text-white animate-pulse shadow-xs">
                {newCalcsCount}
              </span>
            )}
          </button>

          {/* TAB CẢNH BÁO & KHIẾU NẠI */}
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'alerts'
                ? (isLight ? 'bg-white text-slate-950 shadow-md shadow-slate-200/60 border border-slate-200/90' : 'bg-amber-600 text-white shadow-lg')
                : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50')
            }`}
          >
            <AlertTriangle size={16} className={activeTab === 'alerts' ? (isLight ? 'text-amber-600' : 'text-amber-200') : 'opacity-70'} />
            <span>Cảnh Báo & Khiếu Nại</span>
            {(alerts.filter(a => a.status === 'unread').length > 0 || appeals.length > 0) && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-extrabold text-white animate-pulse shadow-xs">
                {alerts.filter(a => a.status === 'unread').length + appeals.length}
              </span>
            )}
          </button>

          {/* TAB QUẢN LÝ BLOG */}
          <button
            type="button"
            onClick={() => setActiveTab('blog')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'blog'
                ? (isLight ? 'bg-white text-slate-950 shadow-md shadow-slate-200/60 border border-slate-200/90' : 'bg-amber-600 text-white shadow-lg')
                : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50')
            }`}
          >
            <BookOpen size={16} className={activeTab === 'blog' ? (isLight ? 'text-amber-600' : 'text-amber-200') : 'opacity-70'} />
            <span>Quản Lý Blog</span>
          </button>

          {/* TAB SỨC KHỎE HỆ THỐNG */}
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'system'
                ? (isLight ? 'bg-white text-slate-950 shadow-md shadow-slate-200/60 border border-slate-200/90' : 'bg-amber-600 text-white shadow-lg')
                : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50')
            }`}
          >
            <Activity size={16} className={activeTab === 'system' ? (isLight ? 'text-amber-600' : 'text-amber-200') : 'opacity-70'} />
            <span>Sức Khỏe Hệ Thống</span>
          </button>

          {/* TAB CẤU HÌNH (SUPER ADMIN ONLY) */}
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
                activeTab === 'config'
                  ? (isLight ? 'bg-white text-slate-950 shadow-md shadow-slate-200/60 border border-slate-200/90' : 'bg-amber-600 text-white shadow-lg')
                  : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50')
              }`}
            >
              <Sliders size={16} className={activeTab === 'config' ? (isLight ? 'text-amber-600' : 'text-amber-200') : 'opacity-70'} />
              <span>Cấu Hình Hệ Thống</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          RENDER ACTIVE TAB CONTENT
          ======================================================== */}

      {/* 1. OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <AdminOverviewTab
          analytics={analytics}
          analyticsLoading={analyticsLoading}
          alerts={alerts}
          appeals={appeals}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          tokenChartMetric={tokenChartMetric}
          setTokenChartMetric={setTokenChartMetric}
          onPresetClick={handlePresetClick}
          onNavigateToAlerts={() => setActiveTab('alerts')}
          onUserClick={handleUserClick}
          health={health}
          queueStatus={queueStatus}
          healthLoading={healthLoading}
          onRefreshHealth={fetchHealthAndQueue}
          onOpenDlqModal={() => setIsDlqModalOpen(true)}
          onNavigateToSystem={() => setActiveTab('system')}
        />
      )}

      {/* 2. USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <AdminUsersTab
          currentUser={currentUser}
          showAlert={showAlert}
          showConfirm={showConfirm}
          onUserClick={handleUserClick}
          onDirtyAnalytics={() => { isAnalyticsDirty.current = true; }}
          fetchAlertsAndAppeals={fetchAlertsAndAppeals}
          refreshTrigger={usersRefreshTrigger}
          initialSearch={initialUserSearch}
        />
      )}

      {/* 3. CALCULATIONS MODERATION */}
      {activeTab === 'calculations' && (
        <AdminCalculationsTab
          showAlert={showAlert}
          showConfirm={showConfirm}
          onUserClick={handleUserClick}
          onDirtyAnalytics={() => { isAnalyticsDirty.current = true; }}
          newIchingCount={newIchingCount}
          newBaziCount={newBaziCount}
          newZiweiCount={newZiweiCount}
          newMarriageCount={newMarriageCount}
          onClearBadge={(type) => {
            if (type === 'iching') setNewIchingCount(0);
            else if (type === 'bazi') setNewBaziCount(0);
            else if (type === 'ziwei') setNewZiweiCount(0);
            else if (type === 'marriage') setNewMarriageCount(0);
          }}
          refreshTrigger={calcsRefreshTrigger}
        />
      )}

      {/* 4. ALERTS & APPEALS */}
      {activeTab === 'alerts' && (
        <AdminAlertsTab
          alerts={alerts}
          setAlerts={setAlerts}
          appeals={appeals}
          setAppeals={setAppeals}
          showAlert={showAlert}
          showConfirm={showConfirm}
          onGoToUser={handleGoToUser}
          fetchAlertsAndAppeals={fetchAlertsAndAppeals}
          onDirtyAnalytics={() => { isAnalyticsDirty.current = true; }}
        />
      )}

      {/* 5. BLOG POSTS MANAGEMENT */}
      {activeTab === 'blog' && (
        <AdminBlogTab
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      )}

      {/* 6. SYSTEM HEALTH & HARDWARE METRICS TAB */}
      {activeTab === 'system' && (
        <AdminSystemTab />
      )}

      {/* 7. SYSTEM CONFIGURATION & HOT-RELOAD (SUPER ADMIN ONLY) */}
      {activeTab === 'config' && currentUser?.role === 'admin' && (
        <AdminConfigTab
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      )}

      {/* USER STATS DETAILS MODAL */}
      <AdminUserStatsModal
        isOpen={isStatsModalOpen}
        userStats={userStats}
        onClose={() => {
          setIsStatsModalOpen(false);
          setUserStats(null);
        }}
      />

      {/* DEAD LETTER QUEUE (DLQ) MODAL */}
      <AdminDlqModal
        isOpen={isDlqModalOpen}
        onClose={() => setIsDlqModalOpen(false)}
        dlqJobs={dlqJobs}
        onRetryJob={handleRetryDlqJob}
        onClearDlq={handleClearDlq}
        onRefresh={fetchHealthAndQueue}
        loading={healthLoading}
      />

      {/* CUSTOM CONFIRMATION AND NOTIFICATION DIALOG */}
      <AdminConfirmModal notification={notification} onClose={() => setNotification(null)} />

    </div>
  );
}

export default function AdminApp(props) {
  return (
    <AdminThemeProvider>
      <AdminAppInner {...props} />
    </AdminThemeProvider>
  );
}

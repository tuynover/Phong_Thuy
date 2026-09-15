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
import AdminDlqModal from '@/features/admin/components/AdminDlqModal';
import {
  getAdminAnalytics,
  getAdminNotifications,
  getAdminUserStats,
  getSystemHealthDetailed,
  getAdminQueueStatus,
  retryAdminDlqJob,
  clearAdminDlq
} from '@/services/api';
import { Shield, LogOut } from 'lucide-react';

export default function AdminApp({ onSwitchToUser }) {
  const { user: currentUser, token, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'calculations' | 'alerts' | 'blog'

  // Custom Notifications / Confirm Modal State
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error' | 'confirm', message: '', onConfirm: null }

  const showAlert = useCallback((message, type = 'success') => {
    setNotification({ type, message });
  }, []);

  const showConfirm = useCallback((message, onConfirm) => {
    setNotification({ type: 'confirm', message, onConfirm });
  }, []);

  // Custom Date Filters for Analytics
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Default 7 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState('day'); // 'day' | 'hour'
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [tokenChartMetric, setTokenChartMetric] = useState('subject'); // 'subject' | 'type' | 'ratio'

  // Warnings / Appeals
  const [alerts, setAlerts] = useState([]);
  const [appeals, setAppeals] = useState([]);

  // User details stats modal state
  const [userStats, setUserStats] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // System Health & Queue Monitoring (DevOps)
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
      console.error('Lỗi khi tải thông báo/khiếu nại:', err);
    }
  }, []);

  const fetchAnalyticsData = useCallback(async () => {
    if (isFetchingAnalytics.current) return;
    isFetchingAnalytics.current = true;
    setAnalyticsLoading(true);
    try {
      const res = await getAdminAnalytics(startDate, endDate, groupBy);
      setAnalytics(res.data);
      lastFetchedAnalyticsParams.current = { startDate, endDate, groupBy };
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thống kê:', err);
    } finally {
      setAnalyticsLoading(false);
      isFetchingAnalytics.current = false;
    }
  }, [startDate, endDate, groupBy]);

  const handleUserClick = useCallback(async (userId) => {
    try {
      const res = await getAdminUserStats(userId);
      setUserStats(res.data);
      setIsStatsModalOpen(true);
    } catch (err) {
      showAlert('Không thể lấy thống kê chi tiết người dùng này.', 'error');
    }
  }, [showAlert]);

  const handleGoToUser = useCallback(async (email, userId) => {
    setActiveTab('users');
    setInitialUserSearch(email);
    try {
      const res = await getAdminUserStats(userId);
      setUserStats(res.data);
      setIsStatsModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handlePresetClick = useCallback((days) => {
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = new Date().toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  }, []);

  // DevOps System Health & Queue Fetching
  const fetchHealthAndQueue = useCallback(async () => {
    setHealthLoading(true);
    try {
      const [healthRes, queueRes] = await Promise.allSettled([
        getSystemHealthDetailed(),
        getAdminQueueStatus(50)
      ]);
      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value.data);
      }
      if (queueRes.status === 'fulfilled') {
        setQueueStatus(queueRes.value.data.queue);
        setDlqJobs(queueRes.value.data.dlqJobs || []);
      }
    } catch (err) {
      console.error('Error fetching system health & queue:', err);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthAndQueue();
    const timer = setInterval(fetchHealthAndQueue, 30000); // 30s auto-refresh
    return () => clearInterval(timer);
  }, [fetchHealthAndQueue]);

  const handleRetryDlqJob = async (jobId) => {
    try {
      await retryAdminDlqJob(jobId);
      showAlert(`Đã đưa job ${jobId?.slice(0, 8)}... trở lại hàng đợi chính.`);
      fetchHealthAndQueue();
    } catch (err) {
      showAlert(err.response?.data?.error || 'Lỗi khi đưa job vào hàng đợi.', 'error');
    }
  };

  const handleClearDlq = () => {
    showConfirm('Bạn có chắc chắn muốn xóa vĩnh viễn toàn bộ thư lỗi trong Dead Letter Queue không?', async () => {
      try {
        await clearAdminDlq();
        showAlert('Đã dọn sạch toàn bộ thư lỗi trong Dead Letter Queue.');
        fetchHealthAndQueue();
      } catch (err) {
        showAlert('Lỗi khi dọn dẹp DLQ.', 'error');
      }
    });
  };

  // Fetch initial system warnings and appeals
  useEffect(() => {
    fetchAlertsAndAppeals();
  }, [fetchAlertsAndAppeals]);

  // Fetch analytics when tab, dates or groupBy change (only if needed)
  useEffect(() => {
    if (activeTab === 'overview') {
      const last = lastFetchedAnalyticsParams.current;
      if (!analytics || isAnalyticsDirty.current || startDate !== last.startDate || endDate !== last.endDate || groupBy !== last.groupBy) {
        fetchAnalyticsData();
        isAnalyticsDirty.current = false;
      }
    }
  }, [activeTab, startDate, endDate, groupBy, analytics, fetchAnalyticsData]);

  // SSE connection for real-time admin updates
  useEffect(() => {
    if (!token) return;

    const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const sseUrl = `${baseApiUrl}/admin/events`;
    const eventSource = new EventSourcePolyfill(sseUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 text-slate-100 shadow-2xl font-sans min-h-[70vh] flex flex-col space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-555/30 rounded-2xl text-amber-500">
              <Shield size={28} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-100">Bảng Điều Khiển Quản Trị</h2>
              <p className="text-xs text-slate-400">
                Quyền hạn: <span className="font-extrabold text-amber-450 uppercase">{currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role === 'co-admin' ? 'Co-Administrator' : ''}</span>
              </p>
            </div>
          </div>

          {/* Sliding Pill Toggle Switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">Giao diện:</span>
            <div className="relative inline-flex items-center bg-slate-950 rounded-full p-1 cursor-pointer select-none w-36 h-9 border border-slate-800">
              <div 
                onClick={onSwitchToUser}
                className="absolute top-1 bottom-1 left-1 bg-amber-600 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(217,119,6,0.5)]"
                style={{
                  width: 'calc(50% - 4px)',
                  transform: 'translateX(0px)'
                }}
              />
              <div className="flex w-full text-center text-[10px] font-bold tracking-wider z-10">
                <span className="flex-1 text-white select-none pointer-events-none">ADMIN APP</span>
                <span onClick={onSwitchToUser} className="flex-1 text-slate-400 hover:text-slate-200 transition-colors select-none">USER APP</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Navigation tabs & Logout */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-amber-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Tổng Quan
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${activeTab === 'users' ? 'bg-amber-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Thành Viên
              {newUsersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white animate-pulse">
                  {newUsersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('calculations')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${activeTab === 'calculations' ? 'bg-amber-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Dịch Bản / Lá Số
              {newCalcsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white animate-pulse">
                  {newCalcsCount}
                </span>
              )}
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
            <button
              onClick={() => setActiveTab('blog')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${activeTab === 'blog' ? 'bg-amber-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Quản Lý Blog
            </button>
          </div>

          <button
            onClick={() => {
              logout();
            }}
            className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200"
            title="Đăng xuất"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}

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

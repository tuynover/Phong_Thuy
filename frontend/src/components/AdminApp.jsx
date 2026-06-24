import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserCredits,
  lockAdminUser,
  unlockAdminUser,
  deleteAdminUser,
  getAdminCalculations,
  getAdminCalculationDetail,
  lockAdminCalculation,
  unlockAdminCalculation,
  deleteAdminCalculation,
  getAdminAnalytics,
  getAdminNotifications,
  markAdminNotificationRead,
  resolveAdminAppeal,
  restoreAdminUser,
  getAdminUserStats
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
  ChevronRight,
  LogOut,
  UserCircle
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

export default function AdminApp({ onSwitchToUser }) {
  const { user: currentUser, token, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'calculations' | 'alerts'
  const [loading, setLoading] = useState(false);

  // Custom Notifications / Confirm Modal State
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error' | 'confirm', message: '', onConfirm: null }

  const showAlert = (message, type = 'success') => {
    setNotification({ type, message });
  };

  const showConfirm = (message, onConfirm) => {
    setNotification({ type: 'confirm', message, onConfirm });
  };

  // Custom Date Filters for Analytics
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Default 7 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState('day'); // 'day' | 'hour'
  const [analytics, setAnalytics] = useState(null);
  const [tokenChartMetric, setTokenChartMetric] = useState('subject'); // 'subject' | 'type' | 'ratio'

  // Warnings / Appeals
  const [alerts, setAlerts] = useState([]);
  const [appeals, setAppeals] = useState([]);

  // User management
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(15); // limit is 15
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userCursors, setUserCursors] = useState([null]); // userCursors state

  // User details stats modal state
  const [userStats, setUserStats] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // User edit states
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditChange, setCreditChange] = useState('');
  const [creditMode, setCreditMode] = useState('add'); // 'add' | 'subtract' | 'set'
  const [lockReason, setLockReason] = useState('');
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  // Calculation management
  const [calcType, setCalcType] = useState('iching'); // 'iching' | 'bazi' | 'tuvi'
  const [calcLimit] = useState(15); // limit is 15
  const [calcSearch, setCalcSearch] = useState('');
  const [calcStatusFilter, setCalcStatusFilter] = useState('');
  const [selectedCalc, setSelectedCalc] = useState(null);

  // Isolated states for calculations sub-tabs (Iching, Bazi, Tuvi)
  const [ichingCalculations, setIchingCalculations] = useState([]);
  const [baziCalculations, setBaziCalculations] = useState([]);
  const [tuviCalculations, setTuviCalculations] = useState([]);

  const [ichingTotal, setIchingTotal] = useState(0);
  const [baziTotal, setBaziTotal] = useState(0);
  const [tuviTotal, setTuviTotal] = useState(0);

  const [ichingPage, setIchingPage] = useState(1);
  const [baziPage, setBaziPage] = useState(1);
  const [tuviPage, setTuviPage] = useState(1);

  const [ichingCursors, setIchingCursors] = useState([null]);
  const [baziCursors, setBaziCursors] = useState([null]);
  const [tuviCursors, setTuviCursors] = useState([null]);

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [ichingLoading, setIchingLoading] = useState(false);
  const [baziLoading, setBaziLoading] = useState(false);
  const [tuviLoading, setTuviLoading] = useState(false);

  const isFetchingAnalytics = useRef(false);
  const isFetchingUsers = useRef(false);
  const isFetchingIching = useRef(false);
  const isFetchingBazi = useRef(false);
  const isFetchingTuvi = useRef(false);

  const [newUsersCount, setNewUsersCount] = useState(0);
  const [newCalcsCount, setNewCalcsCount] = useState(0);
  const [newIchingCount, setNewIchingCount] = useState(0);
  const [newBaziCount, setNewBaziCount] = useState(0);
  const [newTuviCount, setNewTuviCount] = useState(0);

  // Hover preloading cache
  const prefetchedCalcs = useRef({});

  // Dirty flags caching refs
  const isUsersDirty = useRef(true);
  const isCalcsDirty = useRef(true);
  const isAnalyticsDirty = useRef(true);

  // Dynamic state refs for SSE stability
  const activeTabRef = useRef(activeTab);
  const isStatsModalOpenRef = useRef(isStatsModalOpen);
  const userStatsRef = useRef(userStats);
  const fetchUsersDataRef = useRef(null);
  const fetchCalculationsDataRef = useRef(null);
  const fetchAnalyticsDataRef = useRef(null);
  const calcTypeRef = useRef(calcType);

  // Sync refs with state changes
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { isStatsModalOpenRef.current = isStatsModalOpen; }, [isStatsModalOpen]);
  useEffect(() => { userStatsRef.current = userStats; }, [userStats]);
  useEffect(() => { fetchUsersDataRef.current = fetchUsersData; }, [fetchUsersData]);
  useEffect(() => { fetchCalculationsDataRef.current = fetchCalculationsData; }, [fetchCalculationsData]);
  useEffect(() => { fetchAnalyticsDataRef.current = fetchAnalyticsData; }, [fetchAnalyticsData]);
  useEffect(() => { calcTypeRef.current = calcType; }, [calcType]);

  // Clear badges when active tab or sub-tab is selected
  useEffect(() => {
    if (activeTab === 'users') {
      setNewUsersCount(0);
    } else if (activeTab === 'calculations') {
      setNewCalcsCount(0);
      if (calcType === 'iching') setNewIchingCount(0);
      else if (calcType === 'bazi') setNewBaziCount(0);
      else if (calcType === 'tuvi') setNewTuviCount(0);
    }
  }, [activeTab, calcType]);

  // Refs to cache parameters and prevent redundant fetches during tab navigation
  const lastFetchedAnalyticsParams = useRef({ startDate: null, endDate: null, groupBy: null });
  const lastFetchedUsersParams = useRef({ page: null, role: null, status: null, search: null });
  const lastFetchedCalcsParams = useRef({
    iching: { page: null, status: null, search: null },
    bazi: { page: null, status: null, search: null },
    tuvi: { page: null, status: null, search: null }
  });

  // Fetch initial system warnings and appeals
  useEffect(() => {
    fetchAlertsAndAppeals();
  }, []);

  // SSE connection for real-time admin updates
  useEffect(() => {
    if (!token) return;

    const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const sseUrl = `${baseApiUrl}/admin/events?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

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
            fetchAnalyticsDataRef.current?.();
          } else {
            isAnalyticsDirty.current = true;
          }
        } else if (payload.type === 'new_user') {
          // Luôn tự động cập nhật ngầm danh sách thành viên để dữ liệu mới có sẵn ngay lập tức
          if (fetchUsersDataRef.current) {
            fetchUsersDataRef.current();
            isUsersDirty.current = false;
          } else {
            isUsersDirty.current = true;
          }
          // Tăng badge số đỏ nếu admin đang ở tab khác
          if (activeTabRef.current !== 'users') {
            setNewUsersCount(prev => prev + 1);
          }
          if (activeTabRef.current === 'overview') {
            fetchAnalyticsDataRef.current?.();
          } else {
            isAnalyticsDirty.current = true;
          }
        } else if (payload.type === 'new_calculation') {
          const calcTypeReceived = payload.data?.type;
          // Luôn tự động cập nhật ngầm danh sách quẻ/lá số nếu trùng loại đang hiển thị
          if (fetchCalculationsDataRef.current && calcTypeRef.current === calcTypeReceived) {
            fetchCalculationsDataRef.current(calcTypeReceived);
            isCalcsDirty.current = false;
          } else {
            isCalcsDirty.current = true;
          }
          // Tăng badge số đỏ
          if (activeTabRef.current !== 'calculations') {
            setNewCalcsCount(prev => prev + 1);
            if (calcTypeReceived === 'iching') setNewIchingCount(prev => prev + 1);
            else if (calcTypeReceived === 'bazi') setNewBaziCount(prev => prev + 1);
            else if (calcTypeReceived === 'tuvi') setNewTuviCount(prev => prev + 1);
          } else {
            if (calcTypeRef.current !== calcTypeReceived) {
              if (calcTypeReceived === 'iching') setNewIchingCount(prev => prev + 1);
              else if (calcTypeReceived === 'bazi') setNewBaziCount(prev => prev + 1);
              else if (calcTypeReceived === 'tuvi') setNewTuviCount(prev => prev + 1);
            }
          }
          if (activeTabRef.current === 'overview') {
            fetchAnalyticsDataRef.current?.();
          } else {
            isAnalyticsDirty.current = true;
          }
        } else if (payload.type === 'user_updated') {
          // Chỉ reload trang danh sách thành viên nếu đó là hành động sửa quyền, khóa, mở khóa, v.v. (không phải stats tiêu thụ token trong nền)
          if (payload.data?.action !== 'stats') {
            if (activeTabRef.current === 'users') {
              fetchUsersDataRef.current?.();
            } else {
              isUsersDirty.current = true;
            }
          }
          if (activeTabRef.current === 'overview') {
            fetchAnalyticsDataRef.current?.();
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
  }, [token]);

  // Fetch analytics when tab, dates or groupBy change (only if they actually changed)
  useEffect(() => {
    if (activeTab === 'overview') {
      const last = lastFetchedAnalyticsParams.current;
      if (!analytics || isAnalyticsDirty.current || startDate !== last.startDate || endDate !== last.endDate || groupBy !== last.groupBy) {
        fetchAnalyticsData();
        isAnalyticsDirty.current = false;
      }
    }
  }, [activeTab, startDate, endDate, groupBy, analytics]);

  // Fetch users when filters or page changes (only if they actually changed)
  useEffect(() => {
    if (activeTab === 'users') {
      const last = lastFetchedUsersParams.current;
      if (
        users.length === 0 ||
        isUsersDirty.current ||
        userPage !== last.page ||
        userRoleFilter !== last.role ||
        userStatusFilter !== last.status
      ) {
        fetchUsersData();
        isUsersDirty.current = false;
      }
    }
  }, [activeTab, userPage, userRoleFilter, userStatusFilter, users]);

  // Fetch calculations when type, filters or page changes (only if they actually changed)
  useEffect(() => {
    if (activeTab === 'calculations') {
      const last = lastFetchedCalcsParams.current[calcType];
      const activeCalcs = calcType === 'iching' ? ichingCalculations : calcType === 'bazi' ? baziCalculations : tuviCalculations;
      const activeCalcPage = calcType === 'iching' ? ichingPage : calcType === 'bazi' ? baziPage : tuviPage;
      if (
        activeCalcs.length === 0 ||
        isCalcsDirty.current ||
        activeCalcPage !== last.page ||
        calcStatusFilter !== last.status
      ) {
        fetchCalculationsData(calcType);
        isCalcsDirty.current = false;
      }
    }
  }, [activeTab, calcType, ichingPage, baziPage, tuviPage, calcStatusFilter, ichingCalculations, baziCalculations, tuviCalculations]);

  const handlePresetClick = (days) => {
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = new Date().toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  };

  const fetchAlertsAndAppeals = async () => {
    try {
      const res = await getAdminNotifications();
      setAlerts(res.data.alerts || []);
      setAppeals(res.data.appeals || []);
    } catch (err) {
      console.error('Lỗi khi tải thông báo/khiếu nại:', err);
    }
  };

  async function fetchAnalyticsData() {
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
  }

  async function fetchUsersData(overrideSearch = undefined, overrideRole = undefined, overrideStatus = undefined) {
    if (isFetchingUsers.current) return;
    isFetchingUsers.current = true;
    setUsersLoading(true);
    try {
      const targetSearch = overrideSearch !== undefined ? overrideSearch : userSearch;
      const targetRole = overrideRole !== undefined ? overrideRole : userRoleFilter;
      const targetStatus = overrideStatus !== undefined ? overrideStatus : userStatusFilter;
      
      const isFilterReset = overrideSearch !== undefined || overrideRole !== undefined || overrideStatus !== undefined;
      const targetPage = isFilterReset ? 1 : userPage;
      const cursor = isFilterReset ? null : userCursors[targetPage - 1];

      const params = {
        limit: userLimit,
        search: targetSearch,
        role: targetRole,
        status: targetStatus,
        cursor
      };
      const res = await getAdminUsers(params);
      const fetchedUsers = res.data.users || [];
      setUsers(fetchedUsers);
      setUserTotal(res.data.total || 0);

      if (isFilterReset) {
        setUserPage(1);
        setUserCursors([null]);
      }

      if (fetchedUsers.length === userLimit) {
        const nextCursor = fetchedUsers[fetchedUsers.length - 1]._id;
        setUserCursors(prev => {
          const next = [...prev];
          next[targetPage] = nextCursor;
          return next;
        });
      }

      lastFetchedUsersParams.current = {
        page: targetPage,
        role: targetRole,
        status: targetStatus,
        search: targetSearch
      };
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
    } finally {
      setUsersLoading(false);
      isFetchingUsers.current = false;
    }
  }

  async function fetchCalculationsData(typeToFetch = undefined, overrideSearch = undefined, overrideStatus = undefined) {
    const targetType = typeToFetch !== undefined ? typeToFetch : calcType;
    const isFetchingRef = targetType === 'iching' ? isFetchingIching : targetType === 'bazi' ? isFetchingBazi : isFetchingTuvi;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const setLoadingState = targetType === 'iching' ? setIchingLoading : targetType === 'bazi' ? setBaziLoading : setTuviLoading;
    setLoadingState(true);

    try {
      const targetSearch = overrideSearch !== undefined ? overrideSearch : calcSearch;
      const targetStatus = overrideStatus !== undefined ? overrideStatus : calcStatusFilter;

      const activePage = targetType === 'iching' ? ichingPage : targetType === 'bazi' ? baziPage : tuviPage;
      const activeCursors = targetType === 'iching' ? ichingCursors : targetType === 'bazi' ? baziCursors : tuviCursors;

      const isFilterReset = overrideSearch !== undefined || overrideStatus !== undefined;
      const targetPage = isFilterReset ? 1 : activePage;
      const cursor = isFilterReset ? null : activeCursors[targetPage - 1];

      const params = {
        type: targetType,
        limit: calcLimit,
        search: targetSearch,
        status: targetStatus,
        cursor
      };
      const res = await getAdminCalculations(params);
      const fetchedCalcs = res.data.records || [];

      const setCalculationsState = targetType === 'iching' ? setIchingCalculations : targetType === 'bazi' ? setBaziCalculations : setTuviCalculations;
      const setTotalState = targetType === 'iching' ? setIchingTotal : targetType === 'bazi' ? setBaziTotal : setTuviTotal;
      const setCursorsState = targetType === 'iching' ? setIchingCursors : targetType === 'bazi' ? setBaziCursors : setTuviCursors;
      const setPageState = targetType === 'iching' ? setIchingPage : targetType === 'bazi' ? setBaziPage : setTuviPage;

      setCalculationsState(fetchedCalcs);
      setTotalState(res.data.total || 0);

      if (isFilterReset) {
        setPageState(1);
        setCursorsState([null]);
      }

      if (fetchedCalcs.length === calcLimit) {
        const nextCursor = fetchedCalcs[fetchedCalcs.length - 1]._id;
        setCursorsState(prev => {
          const next = [...prev];
          next[targetPage] = nextCursor;
          return next;
        });
      }

      lastFetchedCalcsParams.current[targetType] = {
        page: targetPage,
        status: targetStatus,
        search: targetSearch
      };
    } catch (err) {
      console.error(`Lỗi tải danh sách quẻ/lá số (${targetType}):`, err);
    } finally {
      setLoadingState(false);
      isFetchingRef.current = false;
    }
  }

  const preloadCalculation = async (type, id) => {
    const cacheKey = `${type}:${id}`;
    if (prefetchedCalcs.current[cacheKey]) return;
    try {
      const res = await getAdminCalculationDetail(type, id);
      prefetchedCalcs.current[cacheKey] = res.data;
    } catch (err) {
      console.error('Lỗi preloading bản ghi:', err);
    }
  };

  const handleViewDetails = async (calc) => {
    const cacheKey = `${calcType}:${calc._id}`;
    if (prefetchedCalcs.current[cacheKey]) {
      setSelectedCalc({ ...prefetchedCalcs.current[cacheKey], calcType });
    } else {
      setSelectedCalc({ _id: calc._id, isLoading: true, calcType });
      try {
        const res = await getAdminCalculationDetail(calcType, calc._id);
        prefetchedCalcs.current[cacheKey] = res.data;
        setSelectedCalc({ ...res.data, calcType });
      } catch (err) {
        setSelectedCalc(null);
        showAlert('Lỗi tải chi tiết bản ghi.', 'error');
      }
    }
  };

  // Co-admin checks
  const canManage = (targetUser) => {
    if (!targetUser) return false;
    const currentUserId = currentUser?.id || currentUser?._id;
    const targetUserId = targetUser?.id || targetUser?._id;
    if (currentUserId && targetUserId && currentUserId === targetUserId) return false; // Cannot manage oneself
    if (currentUser && currentUser.role === 'admin') return true;
    if (currentUser && currentUser.role === 'co-admin') {
      return targetUser.role !== 'admin' && targetUser.role !== 'co-admin';
    }
    return false;
  };

  const handleUserClick = async (userId) => {
    try {
      const res = await getAdminUserStats(userId);
      setUserStats(res.data);
      setIsStatsModalOpen(true);
    } catch (err) {
      showAlert('Không thể lấy thống kê chi tiết người dùng này.', 'error');
    }
  };

  const handleGoToUser = async (email, userId) => {
    setActiveTab('users');
    setUserSearch(email);
    setUserRoleFilter('');
    setUserStatusFilter('');
    setUserPage(1);
    fetchUsersData(email, '', '');
    try {
      const res = await getAdminUserStats(userId);
      setUserStats(res.data);
      setIsStatsModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Member Management
  const handleRoleChange = async (userId, newRole) => {
    const targetUser = users.find(u => u._id === userId);
    if (!canManage(targetUser)) {
      showAlert('Bạn không có quyền quản lý tài khoản cấp bậc này.', 'error');
      return;
    }
    showConfirm(`Bạn có chắc muốn chuyển vai trò tài khoản sang "${newRole}"?`, async () => {
      try {
        await updateAdminUserRole(userId, newRole);
        showAlert('Cập nhật vai trò thành công.', 'success');
        isAnalyticsDirty.current = true;
        fetchUsersData();
      } catch (err) {
        showAlert(err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật vai trò.', 'error');
      }
    });
  };

  const handleUpdateCreditsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!canManage(selectedUser)) {
      showAlert('Bạn không có quyền chỉnh sửa credit của tài khoản này.', 'error');
      return;
    }
    const amount = parseInt(creditChange);
    if (isNaN(amount) || amount < 0) {
      showAlert('Số lượt sử dụng không hợp lệ.', 'error');
      return;
    }

    try {
      await updateAdminUserCredits(selectedUser._id, amount, creditMode);
      showAlert('Cập nhật lượt sử dụng thành công.', 'success');
      setCreditChange('');
      setSelectedUser(null);
      isAnalyticsDirty.current = true;
      fetchUsersData();
    } catch (err) {
      showAlert(err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật lượt sử dụng.', 'error');
    }
  };

  const handleLockUserSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !lockReason.trim()) return;
    if (!canManage(selectedUser)) {
      showAlert('Bạn không có quyền khóa tài khoản này.', 'error');
      return;
    }

    try {
      await lockAdminUser(selectedUser._id, lockReason);
      showAlert('Khóa tài khoản thành công.', 'success');
      setIsLockModalOpen(false);
      setLockReason('');
      setSelectedUser(null);
      isAnalyticsDirty.current = true;
      fetchUsersData();
      fetchAlertsAndAppeals();
    } catch (err) {
      showAlert(err.response?.data?.error || 'Có lỗi xảy ra khi khóa tài khoản.', 'error');
    }
  };

  const handleUnlockUser = async (userObj) => {
    if (!canManage(userObj)) {
      showAlert('Bạn không có quyền mở khóa tài khoản này.', 'error');
      return;
    }
    showConfirm(`Bạn có chắc chắn muốn mở khóa tài khoản ${userObj.email}?`, async () => {
      try {
        await unlockAdminUser(userObj._id);
        showAlert('Mở khóa tài khoản thành công.', 'success');
        isAnalyticsDirty.current = true;
        fetchUsersData();
        fetchAlertsAndAppeals();
      } catch (err) {
        showAlert(err.response?.data?.error || 'Có lỗi xảy ra khi mở khóa tài khoản.', 'error');
      }
    });
  };

  const handleDeleteUser = async (userObj) => {
    if (!canManage(userObj)) {
      showAlert('Bạn không có quyền xóa tài khoản này.', 'error');
      return;
    }
    showConfirm(`Bạn có chắc chắn muốn xóa (xóa mềm) tài khoản ${userObj.email}? Tài khoản này sẽ bị đánh dấu xóa.`, async () => {
      try {
        await deleteAdminUser(userObj._id);
        showAlert('Xóa tài khoản thành công.', 'success');
        isAnalyticsDirty.current = true;
        fetchUsersData();
      } catch (err) {
        showAlert(err.response?.data?.error || 'Có lỗi xảy ra khi xóa tài khoản.', 'error');
      }
    });
  };

  const handleRestoreUser = async (userObj) => {
    if (!canManage(userObj)) {
      showAlert('Bạn không có quyền khôi phục tài khoản này.', 'error');
      return;
    }
    showConfirm(`Bạn có chắc chắn muốn khôi phục tài khoản ${userObj.email}?`, async () => {
      try {
        await restoreAdminUser(userObj._id);
        showAlert('Khôi phục tài khoản thành công.', 'success');
        isAnalyticsDirty.current = true;
        fetchUsersData();
      } catch (err) {
        showAlert(err.response?.data?.error || 'Có lỗi xảy ra khi khôi phục tài khoản.', 'error');
      }
    });
  };

  // Handlers for Calculation Moderation
  const handleLockCalculation = async (calc) => {
    const actionStr = calc.status === 'locked' ? 'mở khóa' : 'khóa';
    showConfirm(`Bạn có chắc chắn muốn ${actionStr} bản ghi luận giải này?`, async () => {
      try {
        const targetType = calc.type || calcType;
        if (calc.status === 'locked') {
          await unlockAdminCalculation(targetType, calc._id);
        } else {
          await lockAdminCalculation(targetType, calc._id);
        }
        showAlert(`Đã ${actionStr} bản ghi luận giải.`, 'success');
        isAnalyticsDirty.current = true;
        fetchCalculationsData(targetType);
      } catch (err) {
        showAlert(err.response?.data?.error || 'Lỗi khi cập nhật bản ghi.', 'error');
      }
    });
  };

  const handleDeleteCalculation = async (calc) => {
    showConfirm('Bạn có chắc chắn muốn xóa mềm bản ghi này khỏi lịch sử của người dùng?', async () => {
      try {
        const targetType = calc.type || calcType;
        await deleteAdminCalculation(targetType, calc._id);
        showAlert('Đã xóa bản ghi (xóa mềm).', 'success');
        isAnalyticsDirty.current = true;
        fetchCalculationsData(targetType);
      } catch (err) {
        showAlert(err.response?.data?.error || 'Lỗi khi xóa bản ghi.', 'error');
      }
    });
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
    showConfirm(`Bạn có chắc chắn muốn ${actionStr} này?`, async () => {
      try {
        await resolveAdminAppeal(appealId, action);
        showAlert('Xử lý khiếu nại thành công.', 'success');
        fetchAlertsAndAppeals();
        if (activeTab === 'users') fetchUsersData();
      } catch (err) {
        showAlert(err.response?.data?.error || 'Có lỗi xảy ra.', 'error');
      }
    });
  };

  const activeCalcs = calcType === 'iching' ? ichingCalculations : calcType === 'bazi' ? baziCalculations : tuviCalculations;
  const activeCalcsLoading = calcType === 'iching' ? ichingLoading : calcType === 'bazi' ? baziLoading : tuviLoading;
  const activeCalcPage = calcType === 'iching' ? ichingPage : calcType === 'bazi' ? baziPage : tuviPage;
  const activeCalcTotal = calcType === 'iching' ? ichingTotal : calcType === 'bazi' ? baziTotal : tuviTotal;
  const activeSetCalcPage = calcType === 'iching' ? setIchingPage : calcType === 'bazi' ? setBaziPage : setTuviPage;

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
                  <span className="text-xs text-slate-400">Từ</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-400">Đến</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1">
                  <button
                    onClick={() => setGroupBy('day')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${groupBy === 'day' ? 'bg-amber-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Ngày
                  </button>
                  <button
                    onClick={() => setGroupBy('hour')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${groupBy === 'hour' ? 'bg-amber-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
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
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200"
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
                  tuviTotal: (entry.tuviInterpretTokens || 0) + (entry.tuviChatTokens || 0),
                  interpretRatio: total > 0 ? Math.round(((entry.interpretTokens || 0) / total) * 100) : 0,
                  chatRatio: total > 0 ? Math.round(((entry.chatTokens || 0) / total) * 100) : 0
                };
              });
              return (
                <div className="space-y-8">
                  {/* Visits & Interpretation Chart */}
                  <div className="h-72 w-full">
                    <span className="text-xs text-slate-400 font-bold block mb-2">1. Lượt truy cập (Visit Logs) & Lượt dịch lý (AI Interpretations)</span>
                    <ResponsiveContainer width="100%" height="100%">
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
                        <Area name="Bát Tự" type="monotone" dataKey="bazi" stroke="#3b82f6" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
                        <Area name="Tử Vi" type="monotone" dataKey="tuvi" stroke="#a855f7" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
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
                          className="bg-slate-900 border border-slate-800 text-[11px] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-amber-500 font-semibold"
                        >
                          <option value="subject">Phân bổ Môn học (Kinh Dịch / Bát Tự / Tử Vi)</option>
                          <option value="type">Phân bổ Mục đích (Luận giải / Trò chuyện)</option>
                          <option value="ratio">Tỷ lệ phần trăm (Luận giải vs Trò chuyện %)</option>
                        </select>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
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
                              <Bar name="Bát Tự" dataKey="baziTotal" stackId="tokens" fill="#3b82f6" />
                              <Bar name="Tử Vi" dataKey="tuviTotal" stackId="tokens" fill="#a855f7" />
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {analytics.userConsumption.map((uc, index) => (
                        <tr key={index} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3.5 pr-2">
                            <button
                              type="button"
                              onClick={() => handleUserClick(uc.userId)}
                              className="font-bold text-slate-200 hover:text-amber-500 text-left transition-colors hover:underline"
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
                          <td className="py-3.5 text-center text-slate-300">{uc.tuvi}</td>
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
                            onClick={() => handleUserClick(uc.userId)}
                            className="font-bold text-slate-200 hover:text-amber-500 text-left transition-colors text-sm hover:underline"
                          >
                            {uc.name}
                          </button>
                          <div className="text-[11px] text-slate-500">{uc.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-purple-400">{uc.tokens.toLocaleString()} tokens</div>
                        </div>
                      </div>
                      <div className="flex gap-2 text-[10px] text-slate-450 border-t border-slate-800/40 pt-2">
                        <span>Kinh Dịch: <strong className="text-slate-300">{uc.iching}</strong></span>
                        <span className="text-slate-700">|</span>
                        <span>Bát Tự: <strong className="text-slate-300">{uc.bazi}</strong></span>
                        <span className="text-slate-700">|</span>
                        <span>Tử Vi: <strong className="text-slate-300">{uc.tuvi}</strong></span>
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
                onKeyDown={(e) => e.key === 'Enter' && fetchUsersData(userSearch)}
                placeholder="Tìm tên hoặc email..."
                className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-200"
              />
              <Search className="absolute left-3.5 top-2.5 text-slate-500" size={16} />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setUserSearch('');
                    fetchUsersData('');
                  }}
                  className="absolute right-3 top-2.5 text-slate-550 hover:text-slate-200 transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <X size={16} />
                </button>
              )}
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
                  setUserCursors([null]);
                  fetchUsersData(userSearch, userRoleFilter, userStatusFilter);
                }}
                className="bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                ÁP DỤNG
              </button>
            </div>
          </div>

          {/* USER TABLE GRID */}
          {usersLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
          ) : users.length > 0 ? (
            <div className="bg-slate-950/20 border border-slate-800 rounded-3xl overflow-hidden">
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto">
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
                            <button
                              type="button"
                              onClick={() => handleUserClick(u._id)}
                              className="font-bold text-slate-200 hover:text-amber-505 text-left transition-colors"
                            >
                              {u.name}
                            </button>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                            {u.phone && <div className="text-[10px] text-slate-400 mt-0.5">SĐT: {u.phone}</div>}
                          </td>
                          <td className="py-4 px-3 text-center">
                            {managed ? (
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-2 py-1 text-slate-355 focus:outline-none focus:border-amber-500 font-semibold"
                              >
                                <option value="user">User</option>
                                <option value="vip">Vip</option>
                                {currentUser?.role === 'admin' && <option value="co-admin">Co-Admin</option>}
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
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-550 transition-colors"
                                  title="Điều chỉnh Credit"
                                >
                                  <Coins size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            {u.isDeleted ? (
                              <span className="text-[10px] uppercase font-extrabold bg-red-955/60 text-red-500 border border-red-900/40 px-2 py-0.5 rounded">
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
                              {managed && u.isDeleted && (
                                <button
                                  onClick={() => handleRestoreUser(u)}
                                  className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                                  title="Khôi phục tài khoản"
                                >
                                  Khôi phục
                                </button>
                              )}
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
                                      className="p-1.5 hover:bg-amber-955/60 text-slate-400 hover:text-amber-555 border border-slate-800 hover:border-amber-900/40 rounded-lg transition-all"
                                      title="Khóa tài khoản"
                                    >
                                      <Lock size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1.5 hover:bg-red-950/60 text-slate-400 hover:text-red-555 border border-slate-800 hover:border-red-900/40 rounded-lg transition-all"
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

              {/* Mobile view */}
              <div className="block md:hidden divide-y divide-slate-850 p-4 space-y-4 bg-slate-900/40">
                {users.map((u) => {
                  const managed = canManage(u);
                  return (
                    <div key={u._id} className="pt-4 first:pt-0 space-y-3">
                      {/* Name & Role */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleUserClick(u._id)}
                            className="font-bold text-slate-200 hover:text-amber-500 text-left transition-colors text-sm break-all font-serif"
                          >
                            {u.name}
                          </button>
                          <div className="text-[11px] text-slate-500 break-all">{u.email}</div>
                          {u.phone && <div className="text-[10px] text-slate-400 mt-0.5">SĐT: {u.phone}</div>}
                        </div>
                        <div className="shrink-0 text-right">
                          {managed ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="bg-slate-955 border border-slate-800 text-[11px] rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-amber-500 font-semibold"
                            >
                              <option value="user">User</option>
                              <option value="vip">Vip</option>
                              {currentUser?.role === 'admin' && <option value="co-admin">Co-Admin</option>}
                            </select>
                          ) : (
                            <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded bg-slate-850 text-slate-400 border border-slate-700">
                              {u.role}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Credits & Status */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/30">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Credits:</span>
                          <span className="font-mono font-bold text-amber-500">{u.credits}</span>
                          {managed && (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setCreditChange('');
                                setCreditMode('add');
                              }}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-550 transition-colors"
                              title="Điều chỉnh Credit"
                            >
                              <Coins size={12} />
                            </button>
                          )}
                        </div>

                        <div>
                          {u.isDeleted ? (
                            <span className="text-[10px] uppercase font-extrabold bg-red-955/60 text-red-500 border border-red-900/40 px-2 py-0.5 rounded">
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
                        </div>
                      </div>

                      {/* Actions */}
                      {managed && (
                        <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-800/30">
                          {u.isDeleted ? (
                            <button
                              onClick={() => handleRestoreUser(u)}
                              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors"
                              title="Khôi phục tài khoản"
                            >
                              Khôi phục
                            </button>
                          ) : (
                            <>
                              {u.status === 'locked' ? (
                                <button
                                  onClick={() => handleUnlockUser(u)}
                                  className="flex items-center gap-1 px-2.5 py-1 hover:bg-emerald-955/60 text-emerald-500 border border-emerald-900/40 rounded-lg text-[11px] font-semibold transition-all"
                                  title="Mở khóa tài khoản"
                                >
                                  <Unlock size={11} /> Mở khóa
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setLockReason('');
                                    setIsLockModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 hover:bg-amber-955/60 text-amber-500 border border-amber-900/40 rounded-lg text-[11px] font-semibold transition-all"
                                  title="Khóa tài khoản"
                                >
                                  <Lock size={11} /> Khóa
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="flex items-center gap-1 px-2.5 py-1 hover:bg-red-950/60 text-red-500 border border-red-900/40 rounded-lg text-[11px] font-semibold transition-all"
                                title="Xóa tài khoản"
                              >
                                <Trash2 size={11} /> Xóa
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* PAGINATION CONTROLS */}
              <div className="bg-slate-950/60 border-t border-slate-850 px-4 py-3 flex flex-wrap gap-4 items-center justify-between">
                <span className="text-xs text-slate-400">
                  Hiển thị <span className="font-bold text-slate-200">{users.length}</span> / <span className="font-bold text-slate-200">{userTotal}</span> thành viên
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={userPage <= 1 || usersLoading}
                    onClick={() => setUserPage(p => p - 1)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-300 px-2">Trang {userPage}</span>
                  <button
                    disabled={userPage * userLimit >= userTotal || usersLoading}
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
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl space-y-4">
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
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[1, 5, 10, 50, 100, 500, 1000, 9999].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCreditChange(String(val))}
                          className="px-2 py-1 text-[11px] bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-lg text-slate-300 font-mono transition-colors"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
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
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl space-y-4">
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
              { id: 'iching', name: 'Kinh Dịch', count: newIchingCount },
              { id: 'bazi', name: 'Bát Tự', count: newBaziCount },
              { id: 'tuvi', name: 'Tử Vi', count: newTuviCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setCalcType(tab.id);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap text-center relative ${calcType === tab.id ? 'bg-amber-800 text-white shadow-md' : 'text-slate-450 hover:text-slate-200'}`}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span className="absolute -top-1.5 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white animate-pulse">
                    {tab.count}
                  </span>
                )}
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
                onKeyDown={(e) => e.key === 'Enter' && fetchCalculationsData(calcType, calcSearch)}
                placeholder={calcType === 'iching' ? 'Tìm theo userId hoặc Ý niệm...' : 'Tìm theo userId...'}
                className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-amber-550 text-slate-200"
              />
              <Search className="absolute left-3.5 top-2.5 text-slate-500" size={16} />
              {calcSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setCalcSearch('');
                    fetchCalculationsData(calcType, '');
                  }}
                  className="absolute right-3 top-2.5 text-slate-550 hover:text-slate-200 transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex gap-2 items-center w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                <Filter size={14} />
                Trạng thái:
              </div>
              <select
                value={calcStatusFilter}
                onChange={(e) => setCalcStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-550"
              >
                <option value="">-- Mọi trạng thái --</option>
                <option value="active">Hoạt động</option>
                <option value="locked">Bị Khóa</option>
                <option value="deleted">Đã Xóa</option>
              </select>
              <button
                onClick={() => {
                  if (calcType === 'iching') {
                    setIchingPage(1);
                    setIchingCursors([null]);
                  } else if (calcType === 'bazi') {
                    setBaziPage(1);
                    setBaziCursors([null]);
                  } else {
                    setTuviPage(1);
                    setTuviCursors([null]);
                  }
                  fetchCalculationsData(calcType, calcSearch, calcStatusFilter);
                }}
                className="bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                ÁP DỤNG
              </button>
            </div>
          </div>

          {/* CALCULATION DATA TABLE */}
          {activeCalcsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
          ) : activeCalcs.length > 0 ? (
            <div className="bg-slate-950/20 border border-slate-800 rounded-3xl overflow-hidden">
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto">
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
                    {activeCalcs.map((calc) => (
                      <tr key={calc._id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-4 px-4">
                          {calc.userId && calc.userId !== 'guest' ? (
                            <button
                              type="button"
                              onClick={() => handleUserClick(calc.userId)}
                              className="font-bold text-slate-200 hover:text-amber-500 text-left transition-colors hover:underline block"
                            >
                              {calc.user?.name || 'Thành viên'}
                            </button>
                          ) : (
                            <div className="font-bold text-slate-450">Khách</div>
                          )}
                          <div className="text-[11px] text-slate-500 font-semibold">{calc.user?.email || 'guest'}</div>
                          <div className="text-[10px] text-slate-450 mt-0.5">ID: {calc.userId}</div>
                        </td>
                        <td className="py-4 px-3 max-w-xs truncate">
                          {calcType === 'iching' && (
                            <div className="font-medium text-amber-500 italic" title={calc.question}>
                              "{calc.question || 'Không có câu hỏi'}"
                            </div>
                          )}
                          {calcType === 'bazi' && (
                            <div className="text-slate-300">
                              Giới tính: <span className="font-bold text-slate-100">{(calc.inputInfo?.gender ?? calc.baziData?.gender) === 1 ? 'Nam' : 'Nữ'}</span><br />
                              <span className="text-[11px] text-slate-450">Sinh: {calc.solarTimeline || `${calc.inputInfo?.date || ''} ${calc.inputInfo?.time || ''}`}</span>
                            </div>
                          )}
                          {calcType === 'tuvi' && (
                            <div className="text-slate-300">
                              Giới tính: <span className="font-bold text-slate-100">{calc.inputInfo?.gender || (calc.gender === 1 ? 'Nam' : 'Nữ')}</span><br />
                              <span className="text-[11px] text-slate-450">Sinh: {calc.inputInfo?.date || calc.date} ({calc.inputInfo?.hour !== undefined ? calc.inputInfo.hour : calc.hour} giờ)</span>
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
                              onClick={() => handleViewDetails(calc)}
                              onMouseEnter={() => preloadCalculation(calcType, calc._id)}
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
                                  className="p-1.5 hover:bg-red-955/60 text-slate-400 hover:text-red-550 border border-slate-800 hover:border-red-900/40 rounded-lg transition-all"
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

              {/* Mobile view */}
              <div className="block md:hidden divide-y divide-slate-855 space-y-4 p-4 bg-slate-900/40">
                {activeCalcs.map((calc) => (
                  <div key={calc._id} className="pt-4 first:pt-0 space-y-3">
                    {/* Header: User name & Email */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        {calc.userId && calc.userId !== 'guest' ? (
                          <button
                            type="button"
                            onClick={() => handleUserClick(calc.userId)}
                            className="font-bold text-slate-200 hover:text-amber-500 text-left transition-colors text-sm hover:underline block truncate font-serif"
                          >
                            {calc.user?.name || 'Thành viên'}
                          </button>
                        ) : (
                          <span className="font-bold text-slate-400 text-sm block truncate font-serif">Khách</span>
                        )}
                        <span className="text-[11px] text-slate-500 block truncate">{calc.user?.email || 'guest'}</span>
                        <span className="text-[10px] text-slate-450 mt-0.5 block select-all">ID: {calc.userId}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        {calc.isDeleted ? (
                          <span className="text-[10px] uppercase font-extrabold bg-red-955/60 text-red-500 border border-red-900/40 px-2 py-0.5 rounded">
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
                      </div>
                    </div>

                    {/* Content Detail depending on type */}
                    <div className="text-xs text-slate-300 pt-2 border-t border-slate-800/30">
                      {calcType === 'iching' && (
                        <div className="font-medium text-amber-500 italic max-h-12 overflow-y-auto" title={calc.question}>
                          "{calc.question || 'Không có câu hỏi'}"
                        </div>
                      )}
                      {calcType === 'bazi' && (
                        <div className="space-y-0.5">
                          <div>Giới tính: <span className="font-bold text-slate-100">{(calc.inputInfo?.gender ?? calc.baziData?.gender) === 1 ? 'Nam' : 'Nữ'}</span></div>
                          <div className="text-[11px] text-slate-450 font-semibold">Sinh: {calc.solarTimeline || `${calc.inputInfo?.date || ''} ${calc.inputInfo?.time || ''}`}</div>
                        </div>
                      )}
                      {calcType === 'tuvi' && (
                        <div className="space-y-0.5">
                          <div>Giới tính: <span className="font-bold text-slate-100">{calc.inputInfo?.gender || (calc.gender === 1 ? 'Nam' : 'Nữ')}</span></div>
                          <div className="text-[11px] text-slate-450 font-semibold">Sinh: {calc.inputInfo?.date || calc.date} ({calc.inputInfo?.hour !== undefined ? calc.inputInfo.hour : calc.hour} giờ)</div>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-2">
                        Thời gian: {new Date(calc.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-800/30">
                      <button
                        onClick={() => handleViewDetails(calc)}
                        onMouseEnter={() => preloadCalculation(calcType, calc._id)}
                        onTouchStart={() => preloadCalculation(calcType, calc._id)}
                        className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold transition-all"
                        title="Xem chi tiết"
                      >
                        <Eye size={12} /> Chi tiết
                      </button>
                      {!calc.isDeleted && (
                        <>
                          <button
                            onClick={() => handleLockCalculation(calc)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-[11px] font-semibold ${calc.status === 'locked' ? 'hover:bg-emerald-955/60 text-emerald-500 border-emerald-900/40' : 'hover:bg-amber-955/60 text-amber-500 border-amber-900/40'}`}
                            title={calc.status === 'locked' ? 'Mở khóa bản ghi' : 'Khóa bản ghi'}
                          >
                            {calc.status === 'locked' ? (
                              <><Unlock size={11} /> Mở khóa</>
                            ) : (
                              <><Lock size={11} /> Khóa</>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteCalculation(calc)}
                            className="flex items-center gap-1 px-2.5 py-1 hover:bg-red-950/60 text-red-500 border border-red-900/40 rounded-lg text-[11px] font-semibold transition-all"
                            title="Xóa mềm bản ghi"
                          >
                            <Trash2 size={11} /> Xóa
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              <div className="bg-slate-950/60 border-t border-slate-850 px-4 py-3 flex flex-wrap gap-4 items-center justify-between">
                <span className="text-xs text-slate-400">
                  Hiển thị <span className="font-bold text-slate-200">{activeCalcs.length}</span> / <span className="font-bold text-slate-200">{activeCalcTotal}</span> bản ghi
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={activeCalcPage <= 1 || activeCalcsLoading}
                    onClick={() => activeSetCalcPage(p => p - 1)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-300 px-2">Trang {activeCalcPage}</span>
                  <button
                    disabled={activeCalcPage * calcLimit >= activeCalcTotal || activeCalcsLoading}
                    onClick={() => activeSetCalcPage(p => p + 1)}
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

                {selectedCalc.isLoading ? (
                  <div className="flex-1 h-64 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin"></div>
                  </div>
                ) : (
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
                      <span className="text-slate-500 block">ID Bản ghi (UUID):</span>
                      <span className="font-mono text-slate-400 select-all">{selectedCalc._id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ID Người dùng (User UUID):</span>
                      <span className="font-mono text-slate-400 select-all">{selectedCalc.userId || 'guest'}</span>
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
                          <strong className="text-amber-450 text-sm">
                            {(selectedCalc.primaryHexagram || selectedCalc.primary)?.name || 'Chưa định quẻ'}
                          </strong>
                        </div>
                        <div className="bg-slate-950/35 p-3.5 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block font-bold text-xs mb-1 uppercase tracking-wider">Quẻ Hào Biến:</span>
                          {(selectedCalc.transformedHexagram || selectedCalc.secondary) ? (
                            <>
                              <strong className="text-amber-450 text-sm">
                                {(selectedCalc.transformedHexagram || selectedCalc.secondary).name}
                              </strong>
                            </>
                          ) : (
                            <span className="text-slate-500 italic block text-xs mt-1">Không có Hào biến (Quẻ Tĩnh)</span>
                          )}
                        </div>
                      </div>

                      {/* Ứng kỳ list */}
                      {(selectedCalc.primaryHexagram || selectedCalc.primary)?.ungKy && (selectedCalc.primaryHexagram || selectedCalc.primary).ungKy.length > 0 && (
                        <div className="bg-slate-950/35 p-4 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block font-bold text-xs mb-2 uppercase tracking-wider">Thời gian Ứng Kỳ gợi ý:</span>
                          <div className="flex flex-wrap gap-2">
                            {(selectedCalc.primaryHexagram || selectedCalc.primary).ungKy.map((uk, idx) => (
                              <span key={idx} className="bg-amber-950/60 border border-amber-900/40 text-amber-500 px-3 py-1 rounded-lg text-xs font-bold">
                                {typeof uk === 'object' ? uk.originalText : uk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bazi Details */}
                  {calcType === 'bazi' && selectedCalc.baziData && selectedCalc.baziData.canChi && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Can Chi Năm:</span>
                          <strong className="text-slate-100">
                            {selectedCalc.baziData.canChi.year?.gan} {selectedCalc.baziData.canChi.year?.zhi}
                          </strong>
                        </div>
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Can Chi Tháng:</span>
                          <strong className="text-slate-100">
                            {selectedCalc.baziData.canChi.month?.gan} {selectedCalc.baziData.canChi.month?.zhi}
                          </strong>
                        </div>
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Can Chi Ngày:</span>
                          <strong className="text-slate-100">
                            {selectedCalc.baziData.canChi.day?.gan} {selectedCalc.baziData.canChi.day?.zhi}
                          </strong>
                        </div>
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Can Chi Giờ:</span>
                          <strong className="text-slate-100">
                            {selectedCalc.baziData.canChi.hour?.gan} {selectedCalc.baziData.canChi.hour?.zhi}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tuvi Details */}
                  {calcType === 'tuvi' && selectedCalc.chartData && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Ngũ Hành Cục:</span>
                          <strong className="text-slate-100">{selectedCalc.chartData.fiveElementsClass || 'N/A'}</strong>
                        </div>
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Thân Cư:</span>
                          <strong className="text-slate-100">
                            {selectedCalc.chartData.palaces?.find(p => p.isBodyPalace)?.name || 'N/A'}
                          </strong>
                        </div>
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Con giáp / Hoàng đạo:</span>
                          <strong className="text-slate-100">{selectedCalc.chartData.zodiac || 'N/A'}</strong>
                        </div>
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Ngày sinh Âm Lịch:</span>
                          <strong className="text-slate-100">{selectedCalc.chartData.chineseDate || 'N/A'}</strong>
                        </div>
                        <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850 col-span-2">
                          <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Mệnh Chủ / Thân Chủ:</span>
                          <strong className="text-slate-100">
                            {selectedCalc.chartData.soul || 'N/A'} / {selectedCalc.chartData.body || 'N/A'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Interpretation & Chat Token Metadata */}
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-purple-400 block font-extrabold text-xs uppercase tracking-widest">Chi Tiết Tiêu Thụ Token AI:</span>
                    {((selectedCalc.aiInterpretation && selectedCalc.aiInterpretation.tokensUsed > 0) || (selectedCalc.chatTokens && selectedCalc.chatTokens > 0)) ? (
                      <div className="grid grid-cols-2 gap-3 text-[11px] sm:text-xs text-slate-300">
                        {selectedCalc.aiInterpretation && (
                          <>
                            <div>Model AI sử dụng: <strong className="text-slate-100">{selectedCalc.aiInterpretation.model || 'N/A'}</strong></div>
                            <div>Phiên bản Prompt: <strong className="text-slate-100">{selectedCalc.aiInterpretation.promptVersion || 'N/A'}</strong></div>
                            <div>Tokens Prompt: <strong className="font-mono text-amber-500">{selectedCalc.aiInterpretation.promptTokens || 0}</strong></div>
                            <div>Tokens Completion: <strong className="font-mono text-amber-500">{selectedCalc.aiInterpretation.completionTokens || 0}</strong></div>
                          </>
                        )}
                        <div>Tokens Luận Giải AI: <strong className="font-mono text-amber-500">{selectedCalc.aiInterpretation?.tokensUsed || 0}</strong></div>
                        <div>Tokens Trò Chuyện (Chat): <strong className="font-mono text-amber-500">{selectedCalc.chatTokens || 0}</strong></div>
                        <div className="col-span-2 border-t border-slate-800/80 pt-2 flex justify-between items-center text-xs font-bold text-amber-500">
                          <span>TỔNG CỘNG TOÀN BỘ TOKEN:</span>
                          <span className="font-mono text-sm">{((selectedCalc.aiInterpretation?.tokensUsed || 0) + (selectedCalc.chatTokens || 0)).toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic block text-xs">Không tiêu thụ token (Khách vãng lai hoặc chưa có luận giải/chat).</span>
                    )}
                  </div>

                </div>
              )}
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
              <p className="text-xs text-slate-400">Yêu cầu xem xét mở khóa tài khoản do người dùng gửi lên (Click vào thẻ để kiểm tra hội viên)</p>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {appeals.length > 0 ? (
                appeals.map((ap) => (
                  <div
                    key={ap._id}
                    onClick={() => handleGoToUser(ap.email, ap.userId)}
                    className="p-4 rounded-xl border bg-slate-950/40 border-slate-800 hover:border-amber-500/50 cursor-pointer text-xs space-y-3 transition-all duration-200"
                  >
                    <div>
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="font-bold text-slate-200 break-all">Email: {ap.email}</span>
                        <span className="text-[10px] font-mono text-slate-500">ID: {ap.userId}</span>
                      </div>
                      <div className="text-[11px] text-red-400 font-semibold mt-1">Lý do khóa: "{ap.reason}"</div>
                    </div>

                    <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850 text-slate-300 italic text-[11px]">
                      "{ap.message}"
                    </div>

                    <div className="text-[10px] text-slate-500 block">Thời gian gửi: {new Date(ap.createdAt).toLocaleString('vi-VN')}</div>

                    <div className="flex items-center gap-2 justify-end pt-1" onClick={(e) => e.stopPropagation()}>
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

      {/* USER STATS DETAILS MODAL */}
      {isStatsModalOpen && userStats && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[85vh] p-6 relative shadow-2xl flex flex-col space-y-4">
            <button
              type="button"
              onClick={() => {
                setIsStatsModalOpen(false);
                setUserStats(null);
              }}
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
                <div className="grid grid-cols-3 gap-3">
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
                      <div className="text-sm font-bold text-slate-200 mb-1">{userStats.stats.tuviCount} <span className="text-[10px] text-slate-400 font-normal">lần</span></div>
                    </div>
                    <div className="space-y-0.5 border-t border-slate-850 pt-1 text-[10px] text-slate-450 font-mono text-left">
                      <div>Dịch lý: {(userStats.stats.tuviTokens || 0).toLocaleString()}</div>
                      <div>Chat: {(userStats.stats.tuviChatTokens || 0).toLocaleString()}</div>
                      <div className="text-amber-500 font-bold border-t border-slate-850/60 pt-0.5 mt-0.5">Tổng: {((userStats.stats.tuviTokens || 0) + (userStats.stats.tuviChatTokens || 0)).toLocaleString()}</div>
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
                onClick={() => {
                  setIsStatsModalOpen(false);
                  setUserStats(null);
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl transition-colors text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION AND NOTIFICATION DIALOG */}
      {notification && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
            
            <h3 className={`text-lg font-serif font-bold flex items-center gap-2 ${notification.type === 'confirm' ? 'text-amber-500' : notification.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
              {notification.type === 'confirm' ? (
                <>
                  <Info size={20} />
                  Xác Nhận Hành Động
                </>
              ) : notification.type === 'error' ? (
                <>
                  <AlertTriangle size={20} />
                  Lỗi Hệ Thống
                </>
              ) : (
                <>
                  <Check size={20} />
                  Thông Báo
                </>
              )}
            </h3>

            <p className="text-sm text-slate-350 leading-relaxed">
              {notification.message}
            </p>

            <div className="flex gap-2 justify-end pt-2">
              {notification.type === 'confirm' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setNotification(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl transition-colors text-xs"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (notification.onConfirm) {
                        notification.onConfirm();
                      }
                      setNotification(null);
                    }}
                    className="px-5 py-2 bg-amber-800 hover:bg-amber-750 text-white font-bold rounded-xl transition-colors text-xs shadow-lg shadow-amber-950/40"
                  >
                    Xác nhận
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl transition-colors text-xs"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

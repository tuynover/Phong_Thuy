import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserCredits,
  lockAdminUser,
  unlockAdminUser,
  deleteAdminUser,
  restoreAdminUser
} from '@/services/api';
import {
  Search,
  Filter,
  X,
  Coins,
  Lock,
  Unlock,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function AdminUsersTab({
  currentUser,
  showAlert,
  showConfirm,
  onUserClick,
  onDirtyAnalytics,
  fetchAlertsAndAppeals,
  refreshTrigger,
  initialSearch = ''
}) {
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(15);
  const [userSearch, setUserSearch] = useState(initialSearch || '');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userCursors, setUserCursors] = useState([null]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Credit adjustment modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditChange, setCreditChange] = useState('');
  const [creditMode, setCreditMode] = useState('add');

  // Lock account modal
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');

  const isFetchingUsers = useRef(false);
  const lastFetchedParams = useRef({ page: null, role: null, status: null, search: null });

  // Co-admin permission check
  const canManage = useCallback((targetUser) => {
    if (!targetUser) return false;
    const currentUserId = currentUser?.id || currentUser?._id;
    const targetUserId = targetUser?.id || targetUser?._id;
    if (currentUserId && targetUserId && currentUserId === targetUserId) return false;
    if (currentUser && currentUser.role === 'admin') return true;
    if (currentUser && currentUser.role === 'co-admin') {
      return targetUser.role !== 'admin' && targetUser.role !== 'co-admin';
    }
    return false;
  }, [currentUser]);

  const fetchUsersData = useCallback(async (overrideSearch = undefined, overrideRole = undefined, overrideStatus = undefined) => {
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

      lastFetchedParams.current = {
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
  }, [userSearch, userRoleFilter, userStatusFilter, userPage, userCursors, userLimit]);

  useEffect(() => {
    fetchUsersData();
  }, [userPage, refreshTrigger]);

  useEffect(() => {
    if (initialSearch) {
      setUserSearch(initialSearch);
      setUserRoleFilter('');
      setUserStatusFilter('');
      setUserPage(1);
      setUserCursors([null]);
      fetchUsersData(initialSearch, '', '');
    }
  }, [initialSearch, fetchUsersData]);

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
        if (onDirtyAnalytics) onDirtyAnalytics();
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
      showAlert('Bạn không có quyền chỉnh sửa points của tài khoản này.', 'error');
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
      if (onDirtyAnalytics) onDirtyAnalytics();
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
      if (onDirtyAnalytics) onDirtyAnalytics();
      fetchUsersData();
      if (fetchAlertsAndAppeals) fetchAlertsAndAppeals();
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
        if (onDirtyAnalytics) onDirtyAnalytics();
        fetchUsersData();
        if (fetchAlertsAndAppeals) fetchAlertsAndAppeals();
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
        if (onDirtyAnalytics) onDirtyAnalytics();
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
        if (onDirtyAnalytics) onDirtyAnalytics();
        fetchUsersData();
      } catch (err) {
        showAlert(err.response?.data?.error || 'Có lỗi xảy ra khi khôi phục tài khoản.', 'error');
      }
    });
  };

  return (
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
              className="absolute right-3 top-2.5 text-slate-550 hover:text-slate-200 transition-colors cursor-pointer"
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
            className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
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
            className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
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
            className="bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
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
                  <th className="py-4 px-3 text-center">Points (Xu)</th>
                  <th className="py-4 px-3 text-center">Trạng Thái</th>
                  <th className="py-4 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-855">
                {users.map((u) => {
                  const managed = canManage(u);
                  return (
                    <tr key={u._id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => onUserClick && onUserClick(u._id)}
                          className="font-bold text-slate-200 hover:text-amber-505 text-left transition-colors cursor-pointer hover:underline"
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
                            className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-2 py-1 text-slate-355 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
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
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-550 transition-colors cursor-pointer"
                              title="Điều chỉnh Points"
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
                              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
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
                                  className="p-1.5 hover:bg-emerald-955/60 text-slate-400 hover:text-emerald-500 border border-slate-800 hover:border-emerald-900/40 rounded-lg transition-all cursor-pointer"
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
                                  className="p-1.5 hover:bg-amber-955/60 text-slate-400 hover:text-amber-555 border border-slate-800 hover:border-amber-900/40 rounded-lg transition-all cursor-pointer"
                                  title="Khóa tài khoản"
                                >
                                  <Lock size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 hover:bg-red-950/60 text-slate-400 hover:text-red-555 border border-slate-800 hover:border-red-900/40 rounded-lg transition-all cursor-pointer"
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
                        onClick={() => onUserClick && onUserClick(u._id)}
                        className="font-bold text-slate-200 hover:text-amber-500 text-left transition-colors text-sm break-all font-serif cursor-pointer hover:underline"
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
                          className="bg-slate-955 border border-slate-800 text-[11px] rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
                        >
                          <option value="user">User</option>
                          <option value="vip">Vip</option>
                          {currentUser?.role === 'admin' && <option value="co-admin">Co-Admin</option>}
                        </select>
                      ) : (
                        <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded bg-slate-855 text-slate-400 border border-slate-700">
                          {u.role}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Credits & Status */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/30">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Points:</span>
                      <span className="font-mono font-bold text-amber-500">{u.credits}</span>
                      {managed && (
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setCreditChange('');
                            setCreditMode('add');
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-550 transition-colors cursor-pointer"
                          title="Điều chỉnh Points"
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
                          className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          title="Khôi phục tài khoản"
                        >
                          Khôi phục
                        </button>
                      ) : (
                        <>
                          {u.status === 'locked' ? (
                            <button
                              onClick={() => handleUnlockUser(u)}
                              className="flex items-center gap-1 px-2.5 py-1 hover:bg-emerald-955/60 text-emerald-500 border border-emerald-900/40 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
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
                              className="flex items-center gap-1 px-2.5 py-1 hover:bg-amber-955/60 text-amber-500 border border-amber-900/40 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                              title="Khóa tài khoản"
                            >
                              <Lock size={11} /> Khóa
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="flex items-center gap-1 px-2.5 py-1 hover:bg-red-950/60 text-red-500 border border-red-900/40 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
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
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-mono font-bold text-slate-300 px-2">Trang {userPage}</span>
              <button
                disabled={userPage * userLimit >= userTotal || usersLoading}
                onClick={() => setUserPage(p => p + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 disabled:opacity-50 transition-colors cursor-pointer"
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-serif font-bold text-amber-500 flex items-center gap-2">
              <Coins size={20} />
              Chỉnh Sửa Lượt Sử Dụng (Points)
            </h3>
            <p className="text-xs text-slate-400">
              Tài khoản: <span className="font-bold text-slate-250">{selectedUser.name}</span> ({selectedUser.email})<br />
              Số points hiện tại: <span className="font-extrabold text-amber-450">{selectedUser.credits} Points</span>
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
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${creditMode === opt.value ? 'bg-amber-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">Số điểm (Points)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={creditChange}
                  onChange={(e) => setCreditChange(e.target.value)}
                  placeholder="Nhập số lượng points..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-200 focus:ring-0"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50, 100, 200, 500, 1000, 5000, 10000, 999900].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCreditChange(String(val))}
                      className="px-2 py-1 text-[11px] bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-lg text-slate-300 font-mono transition-colors cursor-pointer"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-850 hover:bg-amber-800 text-white font-bold py-3 rounded-xl transition-colors text-sm cursor-pointer"
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
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
                    className="px-2.5 py-1 bg-slate-955 border border-slate-800 rounded-lg text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {pre}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-red-800 hover:bg-red-750 text-white font-bold py-3 rounded-xl transition-colors text-sm mt-2 cursor-pointer"
              >
                Xác Nhận Khóa
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import NetworkStatusBanner from './components/common/NetworkStatusBanner';
// Pre-trigger import in background for zero-latency module resolution
const userAppPromise = import('./app/UserApp');
const UserApp = React.lazy(() => userAppPromise);
const AdminApp = React.lazy(() => import('./app/AdminApp'));

function App() {
  const { user, loading: authLoading } = useContext(AuthContext);

  const [isAdminMode, setIsAdminMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem('adminMode');
      if (savedMode !== null) return savedMode === 'true';
      const saved = localStorage.getItem('user');
      if (saved) {
        const u = JSON.parse(saved);
        return Boolean(u && (u.role === 'admin' || u.role === 'co-admin'));
      }
    } catch (e) {}
    return false;
  });

  useEffect(() => {
    if (!authLoading) {
      const savedMode = localStorage.getItem('adminMode');
      if (savedMode === null) {
        if (user && (user.role === 'admin' || user.role === 'co-admin')) {
          setIsAdminMode(true);
        } else {
          setIsAdminMode(false);
        }
      }
    }
  }, [user, authLoading]);

  const handleSwitchToUser = () => {
    localStorage.setItem('adminMode', 'false');
    setIsAdminMode(false);
  };

  const handleSwitchToAdmin = () => {
    localStorage.setItem('adminMode', 'true');
    setIsAdminMode(true);
  };

  return (
    <>
      <NetworkStatusBanner />
      <React.Suspense fallback={
        <div className="min-h-screen bg-slate-50 relative flex items-center justify-center font-sans overflow-hidden">
          {/* Subtle Ambient Light Glow matching Homepage */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-gradient-to-tr from-indigo-100/40 via-blue-50/50 to-purple-100/30 rounded-full blur-3xl pointer-events-none" />
          
          {/* Modern Light Frosted Glass Card */}
          <div className="relative z-10 text-center p-8 sm:p-10 bg-white/85 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.04)] max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
              {/* Spinning Ring */}
              <div className="absolute inset-0 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
              {/* Center Brand Logo */}
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-full relative z-10" />
            </div>
            
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest block mb-1 font-[Montserrat]">
              PHONG THỦY LUẬN GIẢI
            </span>
            <p className="text-slate-800 font-extrabold text-sm tracking-wide uppercase">
              {isAdminMode ? 'Đang nạp quản trị...' : 'Đang khởi động hệ thống...'}
            </p>
            <p className="text-slate-400 text-xs font-medium mt-1.5 animate-pulse">
              Đang đồng bộ dữ liệu học thuật...
            </p>
          </div>
        </div>
      }>
        {isAdminMode ? (
          <AdminApp onSwitchToUser={handleSwitchToUser} />
        ) : (
          <UserApp onSwitchToAdmin={handleSwitchToAdmin} />
        )}
      </React.Suspense>
    </>
  );
}

export default App;

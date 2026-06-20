import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './context/AuthContext';

const UserApp = React.lazy(() => import('./components/UserApp'));
const AdminApp = React.lazy(() => import('./components/AdminApp'));

function App() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [isAdminMode, setIsAdminMode] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (user && (user.role === 'admin' || user.role === 'co-admin')) {
        setIsAdminMode(true);
      } else {
        setIsAdminMode(false);
      }
    }
  }, [user, authLoading]);

  if (authLoading || isAdminMode === null) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center font-sans">
        <div className="text-center p-8 bg-white/65 backdrop-blur-md rounded-3xl border border-amber-100 shadow-lg max-w-sm w-full mx-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-900 font-extrabold text-sm tracking-wider uppercase animate-pulse">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center font-sans">
        <div className="text-center p-8 bg-white/65 backdrop-blur-md rounded-3xl border border-amber-100 shadow-lg max-w-sm w-full mx-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-900 font-extrabold text-sm tracking-wider uppercase animate-pulse">Đang tải phân hệ...</p>
        </div>
      </div>
    }>
      {isAdminMode ? (
        <AdminApp onSwitchToUser={() => setIsAdminMode(false)} />
      ) : (
        <UserApp onSwitchToAdmin={() => setIsAdminMode(true)} />
      )}
    </React.Suspense>
  );
}

export default App;

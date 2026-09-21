import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle,
  LogOut,
  Shield,
  Menu,
  History,
  Compass,
  Activity,
  BarChart3,
  Heart,
  Calendar,
  BookOpen,
  Home,
  ChevronLeft,
  ChevronRight,
  Folder
} from 'lucide-react';
import NotificationBell from '@/components/common/NotificationBell';
import { checkHasDrawnDailyFortune, DAILY_FORTUNE_EVENT } from '@/features/iching/data/dailyFortuneData';

export default function Header({
  appMode,
  user,
  onSwitchToAdmin,
  handleSelectModule,
  handleNavZiwei,
  preloadHistoryLists,
  handleNotificationClick,
  userMenuRef,
  isUserMenuOpen,
  setIsUserMenuOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isMobileModulesExpanded,
  setIsMobileModulesExpanded,
  setIsAuthModalOpen,
  setIsMyFoldersOpen,
  setAppMode,
  setHistoricalZiweiId,
  logout,
  onOpenDailyFortune
}) {
  const cleanLunarDate = (str) => {
    if (!str) return '';
    return str.replace(/^Âm lịch:\s*/, '');
  };

  const userId = user?.id || user?._id || 'guest';
  const [hasDrawnDailyFortune, setHasDrawnDailyFortune] = React.useState(() => {
    return checkHasDrawnDailyFortune(userId);
  });

  React.useEffect(() => {
    const updateDailyStatus = () => {
      setHasDrawnDailyFortune(checkHasDrawnDailyFortune(userId));
    };
    updateDailyStatus();

    window.addEventListener(DAILY_FORTUNE_EVENT, updateDailyStatus);
    window.addEventListener('storage', updateDailyStatus);
    return () => {
      window.removeEventListener(DAILY_FORTUNE_EVENT, updateDailyStatus);
      window.removeEventListener('storage', updateDailyStatus);
    };
  }, [userId]);

  return (
    <motion.header 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`sticky top-0 z-40 w-full backdrop-blur-md border-b border-slate-200/50 py-2.5 px-3 sm:px-4 shadow-sm ${appMode === 'home' ? 'bg-white/80' : 'bg-[#f8f5f0]/95 lg:bg-white/70'}`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 sm:gap-6 w-full relative">
        
        {/* Logo on the left */}
        <div 
          onClick={() => handleSelectModule('home')} 
          className="flex items-center gap-2 cursor-pointer select-none shrink-0"
        >
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm" />
          <span className="font-extrabold text-slate-800 tracking-wider text-xs sm:text-sm font-[Montserrat] hidden min-[380px]:inline">
            PHONG THỦY
          </span>
        </div>

        {/* Desktop Center Navigation Tabs */}
        <div className="hidden md:flex items-center bg-white/70 p-1 gap-0.5 sm:gap-1 rounded-full border border-slate-200/50 shadow-sm backdrop-blur-sm">
          <button 
            onClick={() => handleSelectModule('home')} 
            className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'home' ? 'bg-slate-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
          >
            Trang Chủ
          </button>
          <button 
            onClick={() => handleSelectModule('blog')} 
            className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'blog' ? 'bg-indigo-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
          >
            Kiến thức
          </button>
          <button 
            onClick={() => handleSelectModule('iching')} 
            className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'iching' ? 'bg-amber-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
          >
            Kinh Dịch
          </button>
          <button 
            onClick={() => handleSelectModule('bazi')} 
            className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'bazi' ? 'bg-blue-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
          >
            Bát Tự
          </button>
          <button 
            onClick={handleNavZiwei} 
            className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'ziwei' ? 'bg-purple-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
          >
            Tử Vi
          </button>
          <button 
            onClick={() => handleSelectModule('marriage')} 
            className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'marriage' ? 'bg-rose-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
          >
            Hôn Nhân
          </button>
          <button 
            onClick={() => handleSelectModule('xemngay')} 
            className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'xemngay' ? 'bg-emerald-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
          >
            Xem Ngày
          </button>
          {user && (
            <button 
              onClick={() => handleSelectModule('history')} 
              onMouseEnter={preloadHistoryLists}
              onTouchStart={preloadHistoryLists}
              className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'history' ? 'bg-slate-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
            >
              Lịch Sử
            </button>
          )}
        </div>

        {/* RIGHT SIDE SECTION: UTILITIES & AUTH */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Nút Quẻ Ngày Mới */}
          {onOpenDailyFortune && (
            <button
              type="button"
              onClick={onOpenDailyFortune}
              className="relative hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-amber-950 border border-amber-300/80 rounded-full text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              title="Gieo quẻ xăm tre ngày mới"
            >
              <span className="text-sm leading-none">🎋</span>
              <span className="font-extrabold tracking-wide">Quẻ Ngày</span>
              {!hasDrawnDailyFortune && (
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
              )}
            </button>
          )}

          {/* Sliding Pill Toggle Switch for Admin/Co-admin in UserApp */}
          {user && (user.role === 'admin' || user.role === 'co-admin') && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:inline">Giao diện:</span>
              <div className="relative inline-flex items-center bg-gray-200/70 rounded-full p-1 cursor-pointer select-none w-28 h-8 border border-slate-200">
                <div 
                  onClick={onSwitchToAdmin}
                  className="absolute top-0.5 bottom-0.5 left-0.5 bg-indigo-650 rounded-full transition-all duration-300 shadow-sm"
                  style={{
                    width: 'calc(50% - 2px)',
                    transform: 'translateX(52px)',
                    backgroundColor: '#4f46e5'
                  }}
                />
                <div className="flex w-full text-center text-[9px] font-extrabold tracking-wider z-10">
                  <span onClick={onSwitchToAdmin} className="flex-1 text-slate-550 hover:text-slate-900 transition-colors select-none py-1">ADMIN</span>
                  <span className="flex-1 text-white select-none pointer-events-none py-1">USER</span>
                </div>
              </div>
            </div>
          )}

          {/* AUTH MENU */}
          <div className="hidden md:block relative" ref={userMenuRef}>
            {user ? (
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-200/50 text-xs sm:text-sm relative">
                <NotificationBell onNotificationClick={handleNotificationClick} />
                
                {/* Credits Display */}
                <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-850 rounded-full border border-indigo-200/50 text-[11px] font-extrabold font-[Montserrat] shrink-0">
                  <span>{user.credits !== undefined ? user.credits : 0} 🪙</span>
                </div>

                {/* User Dropdown Toggle */}
                <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1 text-slate-800 font-semibold max-w-[80px] sm:max-w-none hover:text-slate-950 transition-colors focus:outline-none"
                    title="Hồ sơ cá nhân"
                  >
                    <UserCircle size={18} className="text-slate-600 shrink-0" />
                    <span className="hidden sm:inline truncate max-w-[140px] md:max-w-[180px]">{user.name}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-44 bg-white rounded-2xl shadow-xl border border-gray-150 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button 
                        onClick={() => {
                          setAppMode('profile');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-950 font-bold transition-colors flex items-center gap-2"
                      >
                        <UserCircle size={15} className="text-indigo-600" />
                        Hồ sơ cá nhân
                      </button>
                      <button 
                        onClick={() => {
                          setIsMyFoldersOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-950 font-bold transition-colors flex items-center gap-2 border-t border-gray-100"
                      >
                        <Folder size={15} className="text-indigo-600" />
                        Lá số của tôi
                      </button>
                      <button 
                        onClick={() => {
                          setAppMode('xemngay');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-950 font-bold transition-colors flex items-center gap-2 border-t border-gray-100"
                      >
                        <Calendar size={15} className="text-emerald-600" />
                        Lịch cá nhân
                      </button>
                      {(user?.role === 'admin' || user?.role === 'co-admin') && (
                        <button 
                          onClick={() => {
                            onSwitchToAdmin();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs sm:text-sm text-indigo-900 hover:bg-indigo-50 font-bold transition-colors flex items-center gap-2 border-t border-gray-100"
                        >
                          <Shield size={15} className="text-indigo-700" />
                          Trang quản trị
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          setAppMode('home');
                        }}
                        className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-650 hover:bg-red-50 font-bold transition-colors flex items-center gap-2 border-t border-gray-100"
                      >
                        <LogOut size={15} />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-sm hover:shadow transition-all duration-205 font-bold text-xs sm:text-sm"
                style={{ backgroundColor: '#4f46e5' }}
              >
                <UserCircle size={16} className="shrink-0" />
                <span className="hidden sm:inline">Đăng Nhập</span>
              </button>
            )}
          </div>

          {/* Mobile Layout Header Controls */}
          <div className="flex md:hidden items-center gap-1 sm:gap-1.5">
            {/* Nút Home (bên tay trái phần kiến thức) */}
            <button 
              onClick={() => handleSelectModule('home')}
              className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${appMode === 'home' ? 'bg-slate-800 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
              title="Trang Chủ"
            >
              <Home size={17} />
            </button>

            {/* Nút Kiến Thức (bên tay trái phần chức năng) */}
            <button 
              onClick={() => handleSelectModule('blog')}
              className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${appMode === 'blog' ? 'bg-indigo-800 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
              title="Kiến Thức Phong Thủy"
            >
              <BookOpen size={17} />
            </button>

            {/* Nút Chức Năng (🧭 >) */}
            <button 
              onClick={() => {
                const nextState = !isMobileModulesExpanded;
                setIsMobileModulesExpanded(nextState);
                if (nextState) setIsMobileMenuOpen(false);
              }}
              className={`px-2 py-1.5 rounded-full transition-all border flex items-center gap-0.5 shadow-xs cursor-pointer ${
                isMobileModulesExpanded 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-600'
              }`}
              title="Luận giải mệnh lý"
            >
              <Compass size={16} />
              {isMobileModulesExpanded ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
            </button>

            {/* Notification Bell */}
            <NotificationBell onNotificationClick={handleNotificationClick} />

            {/* Credits Display (Desktop Only in Header) */}
            {user && (
              <div className="hidden md:flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-indigo-50 text-indigo-850 rounded-full border border-indigo-200/50 text-[10px] sm:text-xs font-extrabold font-[Montserrat] shrink-0 select-none shadow-xs">
                <span>{user.credits !== undefined ? user.credits : 0} 🪙</span>
              </div>
            )}

            {/* History Button */}
            <button 
              onClick={() => {
                if (user) {
                  handleSelectModule('history');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              onMouseEnter={preloadHistoryLists}
              onTouchStart={preloadHistoryLists}
              className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${appMode === 'history' ? 'bg-slate-800 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
              title="Lịch sử phân tích"
            >
              <History size={17} />
            </button>
            
            {/* Menu Button */}
            <button 
              onClick={() => {
                const nextState = !isMobileMenuOpen;
                setIsMobileMenuOpen(nextState);
                if (nextState) setIsMobileModulesExpanded(false);
              }}
              className="relative p-1.5 sm:p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Menu"
            >
              <Menu size={20} />
              {!hasDrawnDailyFortune && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 border border-white"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 grid grid-cols-2 gap-3 md:hidden z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto pb-8"
            >
              <div className="grid grid-cols-2 gap-3 col-span-2">
                {/* USER CREDITS & INFO ROW IN MOBILE DRAWER */}
                {user && (
                  <div className="col-span-2 flex items-center justify-between bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 mb-1">
                    <div className="flex items-center gap-2">
                      <UserCircle size={20} className="text-indigo-600" />
                      <span className="font-extrabold text-xs text-slate-800 truncate max-w-[150px]">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-white text-indigo-850 rounded-full border border-indigo-200/60 text-xs font-black shadow-xs">
                      <span>{user.credits !== undefined ? user.credits : 0} 🪙</span>
                    </div>
                  </div>
                )}

                {/* TRANG CHỦ */}
                <button 
                  onClick={() => { handleSelectModule('home'); setIsMobileMenuOpen(false); }}
                  className="col-span-2 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex gap-3 items-center text-left transition-all cursor-pointer"
                >
                  <Home className="text-slate-600" size={18} />
                  <span className="font-extrabold text-xs text-slate-800">Trang Chủ</span>
                </button>

                {/* KINH DỊCH */}
                <button 
                  onClick={() => { handleSelectModule('iching'); setIsMobileMenuOpen(false); }}
                  className="p-3.5 rounded-2xl bg-amber-50/50 hover:bg-amber-50 border border-amber-100 flex flex-col gap-2 items-start text-left transition-all cursor-pointer"
                >
                  <Compass className="text-amber-700" size={18} />
                  <span className="font-extrabold text-xs text-slate-800">Kinh Dịch</span>
                </button>

                {/* BÁT TỰ */}
                <button 
                  onClick={() => { handleSelectModule('bazi'); setIsMobileMenuOpen(false); }}
                  className="p-3.5 rounded-2xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 flex flex-col gap-2 items-start text-left transition-all cursor-pointer"
                >
                  <Activity className="text-blue-600" size={18} />
                  <span className="font-extrabold text-xs text-slate-800">Bát Tự</span>
                </button>

                {/* TỬ VI */}
                <button 
                  onClick={() => {
                    setHistoricalZiweiId(null);
                    handleSelectModule('ziwei');
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-3.5 rounded-2xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100 flex flex-col gap-2 items-start text-left transition-all cursor-pointer"
                >
                  <BarChart3 className="text-purple-650" size={18} />
                  <span className="font-extrabold text-xs text-slate-800">Tử Vi</span>
                </button>

                {/* HÔN NHÂN */}
                <button 
                  onClick={() => { handleSelectModule('marriage'); setIsMobileMenuOpen(false); }}
                  className="p-3.5 rounded-2xl bg-rose-50/50 hover:bg-rose-50 border border-rose-100 flex flex-col gap-2 items-start text-left transition-all cursor-pointer"
                >
                  <Heart className="text-rose-600" size={18} />
                  <span className="font-extrabold text-xs text-slate-800">Hôn Nhân</span>
                </button>

                {/* XEM NGÀY */}
                <button 
                  onClick={() => { handleSelectModule('xemngay'); setIsMobileMenuOpen(false); }}
                  className="col-span-2 p-3.5 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 flex gap-3 items-center text-left transition-all cursor-pointer"
                >
                  <Calendar className="text-emerald-600" size={18} />
                  <span className="font-extrabold text-xs text-slate-800">Xem Ngày Đẹp Hoàng Đạo</span>
                </button>

                {/* KIẾN THỨC (BLOG) */}
                <button 
                  onClick={() => { handleSelectModule('blog'); setIsMobileMenuOpen(false); }}
                  className="col-span-2 p-3.5 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 flex gap-3 items-center text-left transition-all cursor-pointer"
                >
                  <BookOpen className="text-indigo-650" size={18} />
                  <span className="font-extrabold text-xs text-slate-800">Kiến Thức Phong Thủy</span>
                </button>

                {/* QUẺ NGÀY MỚI CHO MOBILE */}
                {onOpenDailyFortune && (
                  <button 
                    onClick={() => { onOpenDailyFortune(); setIsMobileMenuOpen(false); }}
                    className="col-span-2 p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 flex items-center justify-between transition-all cursor-pointer shadow-2xs relative"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎋</span>
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-amber-950">Quẻ Xăm Ngày Mới</span>
                          {!hasDrawnDailyFortune && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-amber-800/80 font-medium">Lắc xăm tre nhận lộc mỗi ngày</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full">
                      Gieo quẻ →
                    </span>
                  </button>
                )}

                {/* AUTH PROFILE / LOGIN BUTTON FOR MOBILE (CENTERED) */}
                <div className="col-span-2 border-t border-slate-100 pt-4 mt-2 flex flex-col items-center text-center">
                  {user ? (
                    <div className="w-full space-y-4">
                      {/* Centered User Info */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                          <UserCircle size={28} />
                        </div>
                        <div className="space-y-1">
                          <span className="block font-extrabold text-sm text-slate-850">{user.name}</span>
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-850 rounded-full border border-indigo-200/50 text-[10px] font-extrabold">
                            <span>Số Points: {user.credits !== undefined ? user.credits : 0} 🪙</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Centered Actions */}
                      <div className="flex flex-col gap-2 max-w-[240px] mx-auto w-full">
                        <button 
                          onClick={() => { handleSelectModule('profile'); setIsMobileMenuOpen(false); }}
                          className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-bold text-xs text-slate-750 transition-colors cursor-pointer"
                        >
                          Hồ sơ cá nhân
                        </button>
                        <button 
                          onClick={() => { setIsMyFoldersOpen(true); setIsMobileMenuOpen(false); }}
                          className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-center font-bold text-xs text-indigo-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Folder size={14} />
                          Lá số của tôi
                        </button>
                        <button 
                          onClick={() => { handleSelectModule('xemngay'); setIsMobileMenuOpen(false); }}
                          className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-center font-bold text-xs text-emerald-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Calendar size={14} className="text-emerald-600" />
                          Lịch Vạn Niên Cá Nhân
                        </button>
                        {(user?.role === 'admin' || user?.role === 'co-admin') && (
                          <button 
                            onClick={() => { onSwitchToAdmin(); setIsMobileMenuOpen(false); }}
                            className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-750 text-center font-bold text-xs transition-colors cursor-pointer"
                          >
                            Trang quản trị
                          </button>
                        )}
                        <button 
                          onClick={() => { logout(); setIsMobileMenuOpen(false); handleSelectModule('home'); }}
                          className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <LogOut size={13} />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                      className="w-full max-w-[240px] py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      style={{ backgroundColor: '#4f46e5' }}
                    >
                      <UserCircle size={16} />
                      Đăng Nhập / Đăng Ký
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Sub-Header for Modules (🧭 >) */}
      <AnimatePresence>
        {isMobileModulesExpanded && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 w-full md:hidden border-b border-slate-200 shadow-md bg-white z-40"
          >
            <div className="flex items-center justify-around py-2.5 px-2 max-w-md mx-auto">
              <button 
                onClick={() => { handleSelectModule('iching'); setIsMobileModulesExpanded(false); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${appMode === 'iching' ? 'bg-amber-800 text-white shadow-sm' : 'text-amber-855 bg-amber-50/50 border border-amber-100/50 hover:bg-amber-100/50'}`}
              >
                <Compass size={13} />
                <span>Kinh Dịch</span>
              </button>
              <button 
                onClick={() => { handleSelectModule('bazi'); setIsMobileModulesExpanded(false); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${appMode === 'bazi' ? 'bg-blue-800 text-white shadow-sm' : 'text-blue-855 bg-blue-50/50 border border-blue-100/50 hover:bg-blue-100/50'}`}
              >
                <Activity size={13} />
                <span>Bát Tự</span>
              </button>
              <button 
                onClick={() => {
                  handleNavZiwei();
                  setIsMobileModulesExpanded(false);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${appMode === 'ziwei' ? 'bg-purple-800 text-white shadow-sm' : 'text-purple-855 bg-purple-50/50 border border-purple-100/50 hover:bg-purple-100/50'}`}
              >
                <BarChart3 size={13} />
                <span>Tử Vi</span>
              </button>
              <button 
                onClick={() => { handleSelectModule('marriage'); setIsMobileModulesExpanded(false); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${appMode === 'marriage' ? 'bg-rose-800 text-white shadow-sm' : 'text-rose-855 bg-rose-50/50 border border-rose-100/50 hover:bg-rose-100/50'}`}
              >
                <Heart size={13} />
                <span>Hôn Nhân</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

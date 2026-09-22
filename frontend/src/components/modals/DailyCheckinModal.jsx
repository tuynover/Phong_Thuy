import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  Lock, 
  Flame, 
  Coins, 
  Award,
  Calendar,
  AlertCircle,
  LogIn
} from 'lucide-react';
import { claimDailyCheckin, getDailyCheckinStatus } from '@/services/api';

const BASE_CHECKIN_REWARDS = [10, 15, 20, 25, 30, 40, 100];
const getWeekRewards = (week = 1) => {
  const k = Math.max(0, (week || 1) - 1);
  return BASE_CHECKIN_REWARDS.map((base, idx) => {
    if (idx === 6) {
      return base + k * 20;
    }
    return base + k * 10;
  });
};

export default function DailyCheckinModal({ 
  isOpen, 
  onClose, 
  user, 
  setUser, 
  onOpenAuthModal 
}) {
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [successReward, setSuccessReward] = useState(null);
  const [checkinData, setCheckinData] = useState({
    hasCheckedInToday: false,
    currentStreak: 0,
    nextStreak: 1,
    currentWeek: 1,
    dayInWeek: 1,
    rewards: BASE_CHECKIN_REWARDS,
    credits: user?.credits || 0
  });

  // Tải trạng thái điểm danh khi mở modal
  useEffect(() => {
    if (!isOpen) {
      setSuccessReward(null);
      setError(null);
      return;
    }

    if (!user) {
      // Khách vãng lai: Hiển thị preview 7 ngày của Tuần 1
      setCheckinData({
        hasCheckedInToday: false,
        currentStreak: 0,
        nextStreak: 1,
        currentWeek: 1,
        dayInWeek: 1,
        rewards: BASE_CHECKIN_REWARDS,
        credits: 0
      });
      return;
    }

    let isMounted = true;
    const fetchStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getDailyCheckinStatus();
        if (isMounted && res.data) {
          setCheckinData({
            hasCheckedInToday: res.data.hasCheckedInToday,
            currentStreak: res.data.currentStreak || 0,
            nextStreak: res.data.nextStreak || 1,
            currentWeek: res.data.currentWeek || 1,
            dayInWeek: res.data.dayInWeek || 1,
            rewards: res.data.rewards || getWeekRewards(res.data.currentWeek || 1),
            credits: res.data.credits ?? user.credits ?? 0
          });
          // Đồng bộ trạng thái chấm đỏ với Header
          window.dispatchEvent(new CustomEvent('daily_checkin_updated', {
            detail: { hasCheckedInToday: !!res.data.hasCheckedInToday }
          }));
        }
      } catch (err) {
        console.error('Lỗi khi tải trạng thái điểm danh:', err);
        // Fallback sử dụng dữ liệu user hiện tại nếu có
        if (isMounted) {
          const streak = user?.dailyCheckin?.streak || 0;
          const week = Math.floor(Math.max(0, streak - 1) / 7) + 1;
          const day = ((Math.max(0, streak - 1)) % 7) + 1;
          setCheckinData(prev => ({
            ...prev,
            currentStreak: streak,
            nextStreak: streak + 1,
            currentWeek: week,
            dayInWeek: day,
            rewards: getWeekRewards(week),
            credits: user?.credits || 0
          }));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatus();
    return () => { isMounted = false; };
  }, [isOpen, user]);

  // Xử lý mở bao điểm danh
  const handleClaim = async () => {
    if (!user) {
      if (onOpenAuthModal) {
        onClose();
        onOpenAuthModal();
      }
      return;
    }

    if (checkinData.hasCheckedInToday || claiming) return;

    setClaiming(true);
    setError(null);

    try {
      const res = await claimDailyCheckin();
      if (res.data && res.data.success) {
        const rewardAmount = res.data.reward;
        const newStreak = res.data.streak;
        const currentWeek = res.data.currentWeek || 1;
        const dayInWeek = res.data.dayInWeek || 1;
        const updatedCredits = res.data.credits;

        // Cập nhật trạng thái modal
        setCheckinData(prev => ({
          ...prev,
          hasCheckedInToday: true,
          currentStreak: newStreak,
          nextStreak: newStreak + 1,
          currentWeek,
          dayInWeek,
          rewards: res.data.rewards || prev.rewards,
          credits: updatedCredits
        }));

        setSuccessReward({
          amount: rewardAmount,
          streak: newStreak,
          week: currentWeek,
          dayInWeek
        });

        // Đồng bộ User state & LocalStorage toàn ứng dụng
        if (setUser && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        } else if (setUser && user) {
          const updatedUser = {
            ...user,
            credits: updatedCredits,
            dailyCheckin: res.data.dailyCheckin
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // Bắn custom event để Header & các component khác lắng nghe cập nhật điểm và tắt chấm đỏ
        window.dispatchEvent(new CustomEvent('daily_checkin_updated', { 
          detail: { hasCheckedInToday: true } 
        }));
        window.dispatchEvent(new CustomEvent('user_credits_updated', { 
          detail: { credits: updatedCredits, reward: rewardAmount } 
        }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi nhận thưởng. Vui lòng thử lại sau.';
      setError(msg);
      if (err.response?.data?.alreadyCheckedIn) {
        setCheckinData(prev => ({ ...prev, hasCheckedInToday: true }));
        window.dispatchEvent(new CustomEvent('daily_checkin_updated', { 
          detail: { hasCheckedInToday: true } 
        }));
      }
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  const rewards = checkinData.rewards || getWeekRewards(checkinData.currentWeek || 1);
  const activeDayNum = checkinData.dayInWeek || (checkinData.hasCheckedInToday 
    ? ((Math.max(0, checkinData.currentStreak - 1) % 7) + 1)
    : ((Math.max(0, checkinData.nextStreak - 1) % 7) + 1));
  const activeDayIndex = Math.max(0, Math.min(6, activeDayNum - 1));

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-[#FFF5F6] via-[#FFFBFB] to-[#FFF0F3] rounded-3xl p-3.5 sm:p-5 shadow-2xl border border-rose-200/90 text-slate-800 my-auto overflow-hidden font-sans"
        >
          {/* BACKGROUND DECORATIVE ELEMENTS (ĐỎ NHẸ NHÀNG / SOFT WARM ROSE TINT) */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          {/* CLOSE BUTTON */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 p-1.5 sm:p-2 rounded-full bg-rose-100/70 hover:bg-rose-200/80 text-rose-800 transition-colors cursor-pointer z-10"
            title="Đóng"
          >
            <X size={18} />
          </button>

          {/* COMPACT INNER CONTAINER - NẰM TRỌN TRONG 1 MÀN HÌNH KHÔNG CUỘN */}
          <div className="space-y-2.5 sm:space-y-3">
            
            {/* MODAL HEADER */}
            <div className="text-center space-y-1 sm:space-y-1.5 pt-0.5">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100/90 border border-rose-200 text-rose-800 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                <Gift size={12} className="text-rose-600 animate-bounce" />
                <span>Phúc Lộc Hàng Ngày</span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black font-serif tracking-tight flex items-center justify-center gap-2 text-slate-900">
                <span className="shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-sm shadow-rose-500/30">
                  <Sparkles size={16} className="text-amber-200 fill-amber-300" />
                </span>
                <span className="text-slate-900">Điểm Danh May Mắn</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300/80 font-sans font-extrabold shadow-2xs">
                  Tuần {checkinData.currentWeek || 1}
                </span>
              </h2>

              <p className="text-xs sm:text-[13px] text-slate-600 max-w-sm mx-auto leading-relaxed">
                Mỗi ngày mở 1 phong bao nhận Point may mắn. Điểm danh đều đặn để tích lũy quà tặng!
              </p>

              {/* STREAK & STATS BADGES */}
              {user && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] sm:text-xs font-semibold">
                    <Calendar size={12} className="text-rose-600" />
                    <span className="text-slate-500">Giai đoạn:</span>
                    <span className="font-black text-rose-700 font-[Montserrat]">Tuần {checkinData.currentWeek || 1}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] sm:text-xs font-semibold">
                    <Flame size={12} className="text-amber-500 fill-amber-500" />
                    <span className="text-slate-500">Chuỗi:</span>
                    <span className="font-black text-amber-700 font-[Montserrat]">{checkinData.currentStreak} ngày</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-[11px] sm:text-xs font-semibold">
                    <Coins size={12} className="text-indigo-600" />
                    <span className="text-slate-500">Ví Point:</span>
                    <span className="font-black text-indigo-700 font-[Montserrat]">{checkinData.credits} 🪙</span>
                  </div>
                </div>
              )}
            </div>

            {/* SUCCESS REWARD NOTIFICATION BANNER */}
            <AnimatePresence>
              {successReward && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -6 }}
                  className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border border-amber-300 text-center space-y-0.5 shadow-xs"
                >
                  <div className="flex items-center justify-center gap-1.5 text-amber-900 font-black text-xs">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>MỞ BAO THÀNH CÔNG!</span>
                    <Sparkles size={14} className="text-amber-600" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-700 font-medium">
                    Bạn nhận được <span className="font-black text-rose-700 text-xs sm:text-sm font-[Montserrat]">+{successReward.amount} Points</span> (Tuần {successReward.week || 1} • Ngày {successReward.dayInWeek || 1}/7 • Chuỗi {successReward.streak} ngày). Chúc bạn vạn sự hanh thông!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ERROR ALERT */}
            {error && (
              <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 7 LUCKY ENVELOPES GRID - Ô LÌ XÌ SÁNG NỔI BẬT TRÊN NỀN */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {rewards.map((pts, idx) => {
                const dayNum = idx + 1;
                const isDay7 = dayNum === 7;

                // Trạng thái của từng phong bao trong tuần hiện tại:
                let isClaimed = false;
                let isTodayActive = false;
                let isLocked = false;

                if (checkinData.hasCheckedInToday) {
                  isClaimed = dayNum <= activeDayNum;
                  isTodayActive = false;
                  isLocked = dayNum > activeDayNum;
                } else {
                  isClaimed = dayNum < activeDayNum;
                  isTodayActive = dayNum === activeDayNum;
                  isLocked = dayNum > activeDayNum;
                }

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      if (isTodayActive && !checkinData.hasCheckedInToday) {
                        handleClaim();
                      }
                    }}
                    className={`
                      relative rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-between text-center transition-all select-none
                      ${isDay7 
                        ? 'col-span-2 bg-gradient-to-br from-amber-100/95 via-white to-amber-50/90 border-2 border-amber-400 shadow-md' 
                        : 'bg-white border-2 border-rose-100/90 hover:border-rose-300 shadow-md'}
                      ${isTodayActive ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-rose-50 scale-102 cursor-pointer shadow-lg shadow-amber-500/20' : ''}
                      ${isClaimed ? 'bg-emerald-50/80 border-emerald-200 opacity-90' : ''}
                      ${isLocked ? 'bg-white' : ''}
                      ${isTodayActive && !checkinData.hasCheckedInToday ? 'hover:scale-104 active:scale-96' : ''}
                    `}
                  >
                    {/* TOP BADGE: DAY NUMBER */}
                    <div className="flex items-center justify-between w-full text-[10px] sm:text-[11px] font-extrabold text-slate-700 mb-0.5 px-0.5">
                      <span>Ngày {dayNum}</span>
                      {isDay7 && (
                        <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-2xs">
                          Đại Thưởng
                        </span>
                      )}
                    </div>

                    {/* CENTER: LUCKY ENVELOPE GRAPHIC - PHONG BAO ĐỎ NỔI BẬT */}
                    <div className="my-1 relative flex items-center justify-center">
                      {isClaimed ? (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-xs">
                          <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
                        </div>
                      ) : (
                        <motion.div
                          animate={isTodayActive && !checkinData.hasCheckedInToday ? { 
                            rotate: [-2, 2, -2],
                            scale: [1, 1.04, 1]
                          } : {}}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className={`
                            relative flex items-center justify-center rounded-xl shadow-md transition-transform
                            ${isDay7 
                              ? 'w-11 h-12 sm:w-12 sm:h-14 bg-gradient-to-b from-amber-500 via-red-600 to-red-800 border-2 border-yellow-300 text-xl shadow-red-900/30' 
                              : 'w-9 h-11 sm:w-11 sm:h-13 bg-gradient-to-b from-red-600 via-red-700 to-rose-950 border-2 border-amber-300/90 shadow-md shadow-red-900/35'}
                          `}
                        >
                          {/* Nắp phong bao */}
                          <div className="absolute top-0 inset-x-0 h-3 sm:h-3.5 border-b border-amber-300/80 rounded-t-xl bg-red-700 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-xs" />
                          </div>
                          {/* Thân phong bao - Biểu tượng may mắn thuần Việt, không dùng chữ tiếng Trung */}
                          <div className="mt-1.5 sm:mt-2 text-amber-200 flex items-center justify-center">
                            {isDay7 ? (
                              <Gift size={18} className="sm:w-5 sm:h-5 text-amber-200 drop-shadow-sm" />
                            ) : (
                              <Sparkles size={14} className="sm:w-4 sm:h-4 text-amber-300 fill-amber-300 drop-shadow-sm" />
                            )}
                          </div>

                          {isTodayActive && !checkinData.hasCheckedInToday && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                            </span>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* BOTTOM: REWARD AMOUNT */}
                    <div className="text-center w-full">
                      <span className={`
                        block font-black font-[Montserrat] tracking-tight text-xs sm:text-sm
                        ${isDay7 ? 'text-amber-800' : 'text-rose-700'}
                        ${isClaimed ? 'text-slate-400 line-through' : ''}
                      `}>
                        +{pts} Point
                      </span>

                      <span className={`
                        text-[9px] font-bold block mt-0.5
                        ${isClaimed ? 'text-emerald-600' : isTodayActive ? (checkinData.hasCheckedInToday ? 'text-slate-500' : 'text-amber-600 animate-pulse') : 'text-slate-400'}
                      `}>
                        {isClaimed ? 'Đã Nhận' : isTodayActive ? (checkinData.hasCheckedInToday ? 'Hoàn Thành' : 'Mở Ngay') : 'Chờ Mở'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ACTION BUTTON - GỌN GÀNG, KHÔNG CẦN CUỘN */}
            <div className="pt-0.5">
              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenAuthModal) onOpenAuthModal();
                  }}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-md shadow-amber-500/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn size={16} />
                  <span>Đăng Nhập Để Nhận Thưởng</span>
                </button>
              ) : checkinData.hasCheckedInToday ? (
                <div className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-slate-100/90 border border-slate-200 text-slate-600 font-bold text-xs text-center flex items-center justify-center gap-2 shadow-2xs">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Bạn đã điểm danh hôm nay. Hãy quay lại vào ngày mai nhé!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={claiming || loading}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-600 hover:via-rose-700 hover:to-amber-700 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-rose-500/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Gift size={16} className="text-yellow-200 fill-yellow-200" />
                  <span>{claiming ? 'Đang Mở Phong Bao...' : `Mở Bao May Mắn (+${rewards[activeDayIndex] || 10} Points)`}</span>
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

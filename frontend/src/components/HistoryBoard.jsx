import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getIChingHistory, getBaziHistory, getZiweiHistory, getMarriageHistory, rateIChing, rateBazi, rateZiwei, rateMarriage, deleteCalculation, getIChingRecord, getBaziRecord, getZiweiRecord, getMarriageRecord, pinCalculation, togglePublicCalculation } from '../services/api';
import { Star, Clock, Calendar, Trash2, X, Info, Check, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Pin, Eye, Share2 } from 'lucide-react';
import FloatingNotificationToast from './FloatingNotificationToast';

const LUNAR_HOURS_MAP = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"
];

const CustomDatePicker = ({ value, onChange, label, activeTheme, activeTab, align = 'left', minDate, maxDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (value) {
            setCurrentDate(new Date(value));
        }
    }, [value]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const getDaysInMonth = (y, m) => {
        const date = new Date(y, m, 1);
        const days = [];
        let dayOfWeek = date.getDay();
        let startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const prevMonthLastDate = new Date(y, m, 0).getDate();
        for (let i = startOffset - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDate - i,
                isCurrentMonth: false,
                dateObj: new Date(y, m - 1, prevMonthLastDate - i)
            });
        }

        const totalDays = new Date(y, m + 1, 0).getDate();
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                dateObj: new Date(y, m, i)
            });
        }

        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                dateObj: new Date(y, m + 1, i)
            });
        }

        return days;
    };

    const days = getDaysInMonth(year, month);

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleSelectDay = (dateObj, e) => {
        e.stopPropagation();
        const localDateStr = dateObj.getFullYear() + '-' + 
            String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + 
            String(dateObj.getDate()).padStart(2, '0');
        onChange(localDateStr);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
    };

    const handleToday = (e) => {
        e.stopPropagation();
        const todayStr = new Date().toISOString().split('T')[0];
        onChange(todayStr);
        setIsOpen(false);
    };

    const formatDisplayDate = (val) => {
        if (!val) return '';
        const parts = val.split('-');
        if (parts.length !== 3) return val;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const themeBg = activeTab === 'iching' ? 'bg-amber-800 text-white hover:bg-amber-900' : activeTab === 'bazi' ? 'bg-blue-800 text-white hover:bg-blue-900' : activeTab === 'ziwei' ? 'bg-purple-800 text-white hover:bg-purple-900' : 'bg-rose-800 text-white hover:bg-rose-900';
    const themeText = activeTab === 'iching' ? 'text-amber-800 hover:bg-amber-50' : activeTab === 'bazi' ? 'text-blue-800 hover:bg-blue-50' : activeTab === 'ziwei' ? 'text-purple-800 hover:bg-purple-50' : 'text-rose-800 hover:bg-rose-50';
    const themeBorder = activeTab === 'iching' ? 'focus:border-amber-600 focus:ring-amber-500/20' : activeTab === 'bazi' ? 'focus:border-blue-600 focus:ring-blue-500/20' : activeTab === 'ziwei' ? 'focus:border-purple-600 focus:ring-purple-500/20' : 'focus:border-rose-600 focus:border-rose-500/20';

    return (
        <div className="relative flex-1 sm:flex-none" ref={containerRef}>
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">{label}</span>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full sm:w-44 text-left pl-11 pr-3 py-2.5 text-sm border border-gray-200 rounded-2xl bg-white shadow-sm transition-all duration-300 flex items-center justify-between hover:border-gray-300 focus:outline-none focus:ring-4 ${themeBorder}`}
            >
                <span className={value ? 'text-gray-800 font-semibold' : 'text-gray-405'}>
                    {formatDisplayDate(value) || 'Chọn ngày...'}
                </span>
                <Calendar size={14} className="text-gray-400 ml-1.5 flex-shrink-0" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop blur overlay for Mobile only */}
                    <div 
                        className="fixed inset-0 bg-black/40 backdrop-blur-[1.5px] z-50 sm:hidden animate-in fade-in duration-200"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    />
                    
                    {/* Calendar Popup Container */}
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[310px] bg-white rounded-[2rem] p-5 shadow-2xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-200 
                            sm:absolute sm:top-auto sm:left-auto sm:translate-x-0 sm:translate-y-0 sm:w-72 sm:p-4 sm:border-gray-150 sm:shadow-xl sm:mt-2 sm:rounded-3xl
                            ${align === 'right' ? 'sm:right-0 sm:left-auto' : 'sm:left-0 sm:right-auto'}`}
                    >
                        <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-gray-800">
                                    Tháng {month + 1}
                                </span>
                                <span className="text-xs font-bold text-gray-400">
                                    {year}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="p-2 sm:p-1.5 rounded-xl hover:bg-gray-100 text-gray-650 transition-colors"
                                >
                                    <ChevronLeft size={18} className="sm:w-4 sm:h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="p-2 sm:p-1.5 rounded-xl hover:bg-gray-100 text-gray-650 transition-colors"
                                >
                                    <ChevronRight size={18} className="sm:w-4 sm:h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dayName) => (
                                <span key={dayName} className="text-xs sm:text-[10px] font-bold text-gray-400 select-none">
                                    {dayName}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                            {days.map((dayItem, idx) => {
                                let isDisabled = !dayItem.isCurrentMonth;
                                if (dayItem.isCurrentMonth) {
                                    const dateStr = dayItem.dateObj.getFullYear() + '-' + 
                                        String(dayItem.dateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                                        String(dayItem.dateObj.getDate()).padStart(2, '0');
                                    if (minDate && dateStr < minDate) isDisabled = true;
                                    if (maxDate && dateStr > maxDate) isDisabled = true;
                                }

                                const isSelected = value && value === dayItem.dateObj.toISOString().split('T')[0];
                                const isToday = new Date().toISOString().split('T')[0] === dayItem.dateObj.toISOString().split('T')[0];
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={(e) => !isDisabled && handleSelectDay(dayItem.dateObj, e)}
                                        disabled={isDisabled}
                                        className={`aspect-square text-sm sm:text-xs font-semibold rounded-full flex items-center justify-center transition-all p-2 sm:p-0 ${
                                            !dayItem.isCurrentMonth
                                                ? 'text-gray-200 cursor-default pointer-events-none'
                                                : isDisabled
                                                    ? 'text-gray-300 bg-gray-50/50 cursor-not-allowed pointer-events-none'
                                                    : isSelected
                                                        ? themeBg + ' shadow-md font-bold scale-105'
                                                        : isToday
                                                            ? 'border border-gray-350 font-bold ' + themeText
                                                            : 'text-gray-705 hover:bg-gray-105'
                                        }`}
                                    >
                                        {dayItem.day}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-gray-100 text-xs">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-red-500 hover:text-red-750 font-bold px-3 py-2 sm:px-2.5 sm:py-1 rounded-xl hover:bg-red-50 transition-colors"
                            >
                                Xóa
                            </button>
                            <button
                                type="button"
                                onClick={handleToday}
                                className={`${themeText} font-bold px-3 py-2 sm:px-2.5 sm:py-1 rounded-xl transition-colors`}
                            >
                                Hôm nay
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const HistoryBoard = ({ onViewHexagram, onViewBazi, onViewZiwei, onViewMarriage, preloadedData, onCacheInvalidate, active, onSaveCache }) => {
    const { user } = useContext(AuthContext);
    const [hexagrams, setHexagrams] = useState([]);
    const [bazis, setBazis] = useState([]);
    const [ziweis, setZiweis] = useState([]);
    const [marriages, setMarriages] = useState([]);
    const [toastMsg, setToastMsg] = useState('');
    const [loading, setLoading] = useState(() => {
        if (preloadedData && preloadedData.hexagrams) {
            return false;
        }
        return true;
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('iching'); // 'iching' | 'bazi' | 'ziwei' | 'marriage'
    const [dialog, setDialog] = useState(null); // { type: 'confirm' | 'success' | 'error', message: '', onConfirm: null }
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeQuickFilter, setActiveQuickFilter] = useState('');

    const handleQuickFilter = (type) => {
        const end = new Date();
        const start = new Date();
        const todayStr = end.getFullYear() + '-' + String(end.getMonth() + 1).padStart(2, '0') + '-' + String(end.getDate()).padStart(2, '0');

        if (type === 'today') {
            setStartDate(todayStr);
            setEndDate(todayStr);
            setActiveQuickFilter('today');
        } else if (type === 'yesterday') {
            start.setDate(end.getDate() - 1);
            const yesterdayStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
            setStartDate(yesterdayStr);
            setEndDate(yesterdayStr);
            setActiveQuickFilter('yesterday');
        } else if (type === '7days') {
            start.setDate(end.getDate() - 7);
            const startStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
            setStartDate(startStr);
            setEndDate(todayStr);
            setActiveQuickFilter('7days');
        } else if (type === '30days') {
            start.setDate(end.getDate() - 30);
            const startStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
            setStartDate(startStr);
            setEndDate(todayStr);
            setActiveQuickFilter('30days');
        }
        setCurrentPage(1);
    };
    const prefetchedDetails = useRef({});

    const ITEMS_PER_PAGE = 15;
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page to 1 when changing tabs
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    // Scroll to top of window when page changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    const getActiveListData = () => {
        if (activeTab === 'iching') return hexagrams;
        if (activeTab === 'bazi') return bazis;
        if (activeTab === 'ziwei') return ziweis;
        if (activeTab === 'marriage') return marriages;
        return [];
    };

    const activeList = getActiveListData();
    const totalItems = activeList.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedList = activeList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const activeTheme = activeTab === 'iching' 
        ? { text: 'text-amber-800', bg: 'bg-amber-800 hover:bg-amber-900', border: 'border-amber-100', textAccent: 'text-amber-600' }
        : activeTab === 'bazi'
            ? { text: 'text-blue-800', bg: 'bg-blue-800 hover:bg-blue-900', border: 'border-blue-100', textAccent: 'text-blue-600' }
            : activeTab === 'ziwei'
                ? { text: 'text-purple-800', bg: 'bg-purple-800 hover:bg-purple-900', border: 'border-purple-100', textAccent: 'text-purple-600' }
                : { text: 'text-rose-800', bg: 'bg-rose-800 hover:bg-rose-900', border: 'border-rose-100', textAccent: 'text-rose-600' };

    const showConfirm = (message, onConfirm) => {
        setDialog({ type: 'confirm', message, onConfirm });
    };

    const showAlert = (message, type = 'success') => {
        setDialog({ type, message });
    };

    useEffect(() => {
        if (user && (active ?? true)) {
            initData();
        }
    }, [user, preloadedData, active, startDate, endDate]);

    // Clear detail cache when user changes (logout/switch accounts)
    useEffect(() => {
        prefetchedDetails.current = {};
    }, [user]);

    const initData = async () => {
        if (startDate || endDate) {
            fetchData({ startDate, endDate });
            return;
        }

        if (preloadedData && (preloadedData.hexagrams || preloadedData.promise)) {
            if (preloadedData.hexagrams) {
                setHexagrams(preloadedData.hexagrams);
                setBazis(preloadedData.bazis);
                setZiweis(preloadedData.tuvis); // Map tuvis to ziweis
                if (preloadedData.marriages) {
                    setMarriages(preloadedData.marriages);
                } else {
                    fetchMarriageOnly();
                }
                setLoading(false);
            } else if (preloadedData.promise) {
                setLoading(true);
                try {
                    const data = await preloadedData.promise;
                    if (data) {
                        setHexagrams(data.hexagrams);
                        setBazis(data.bazis);
                        setZiweis(data.tuvis);
                        if (data.marriages) {
                            setMarriages(data.marriages);
                        } else {
                            fetchMarriageOnly();
                        }
                    }
                } catch (err) {
                    console.error("Error loading preloaded history lists:", err);
                    fetchData();
                    return;
                }
                setLoading(false);
            }
        } else {
            fetchData();
        }
    };

    const fetchMarriageOnly = async () => {
        try {
            const userId = user?.id || user?._id;
            if (!userId || userId === 'undefined') return;
            const res = await getMarriageHistory(userId);
            setMarriages(res.data);
            if (onSaveCache && preloadedData) {
                onSaveCache({
                    ...preloadedData,
                    marriages: res.data
                });
            }
        } catch (err) {
            console.error("Error fetching marriage history", err);
        }
    };

    const fetchData = async (filters = {}) => {
        setLoading(true);
        try {
            const userId = user?.id || user?._id;
            if (!userId || userId === 'undefined') {
                setLoading(false);
                return;
            }
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;


            const [hexRes, baziRes, ziweiRes, marriageRes] = await Promise.all([
                getIChingHistory(userId, params),
                getBaziHistory(userId, params),
                getZiweiHistory(userId, params),
                getMarriageHistory(userId, params)
            ]);
            setHexagrams(hexRes.data);
            setBazis(baziRes.data);
            setZiweis(ziweiRes.data);
            setMarriages(marriageRes.data);
            if (onSaveCache && !filters.startDate && !filters.endDate) {
                onSaveCache({
                    hexagrams: hexRes.data,
                    bazis: baziRes.data,
                    tuvis: ziweiRes.data,
                    marriages: marriageRes.data,
                    promise: null
                });
            }
        } catch (error) {
            console.error("Error fetching history", error);
        }
        setLoading(false);
    };

    const preloadRecord = async (type, id) => {
        const cacheKey = `${type}:${id}`;
        if (prefetchedDetails.current[cacheKey]) return;
        prefetchedDetails.current[cacheKey] = 'loading';
        try {
            let res;
            if (type === 'iching') {
                res = await getIChingRecord(id);
            } else if (type === 'bazi') {
                res = await getBaziRecord(id);
            } else if (type === 'ziwei') {
                res = await getZiweiRecord(id);
            } else if (type === 'marriage') {
                res = await getMarriageRecord(id);
            }
            if (res && res.data) {
                prefetchedDetails.current[cacheKey] = res.data;
            }
        } catch (err) {
            console.error(`Error preloading ${type} ${id}:`, err);
            delete prefetchedDetails.current[cacheKey];
        }
    };

    const handleViewMarriageDetail = async (record) => {
        const cacheKey = `marriage:${record._id}`;
        let detail = prefetchedDetails.current[cacheKey];
        if (!detail || detail === 'loading') {
            setActionLoading(true);
            try {
                const res = await getMarriageRecord(record._id);
                detail = res.data;
                prefetchedDetails.current[cacheKey] = detail;
            } catch (err) {
                console.error("Lỗi khi tải chi tiết hợp hôn:", err);
                showAlert("Không thể tải thông tin chi tiết hợp hôn.", "error");
                setActionLoading(false);
                return;
            }
            setActionLoading(false);
        }
        onViewMarriage(detail);
    };

    const handleViewHexagramDetail = async (record) => {
        const cacheKey = `iching:${record._id}`;
        let detail = prefetchedDetails.current[cacheKey];
        if (!detail || detail === 'loading') {
            setActionLoading(true);
            try {
                const res = await getIChingRecord(record._id);
                detail = res.data;
                prefetchedDetails.current[cacheKey] = detail;
            } catch (err) {
                console.error("Lỗi khi tải chi tiết quẻ dịch:", err);
                showAlert("Không thể tải thông tin chi tiết quẻ dịch.", "error");
                setActionLoading(false);
                return;
            }
            setActionLoading(false);
        }
        onViewHexagram(detail);
    };

    const handleViewBaziDetail = async (record) => {
        const cacheKey = `bazi:${record._id}`;
        let detail = prefetchedDetails.current[cacheKey];
        if (!detail || detail === 'loading') {
            setActionLoading(true);
            try {
                const res = await getBaziRecord(record._id);
                detail = res.data;
                prefetchedDetails.current[cacheKey] = detail;
            } catch (err) {
                console.error("Lỗi khi tải chi tiết Bát Tự:", err);
                showAlert("Không thể tải thông tin chi tiết Bát Tự.", "error");
                setActionLoading(false);
                return;
            }
            setActionLoading(false);
        }
        onViewBazi(detail);
    };

    const handleRate = async (type, id, rating, feedback) => {
        try {
            if (type === 'iching') {
                await rateIChing(id, rating, feedback);
                setHexagrams(hexagrams.map(h => h._id === id ? { ...h, rating, feedback } : h));
            } else if (type === 'bazi') {
                await rateBazi(id, rating, feedback);
                setBazis(bazis.map(b => b._id === id ? { ...b, rating, feedback } : b));
            } else if (type === 'ziwei') {
                await rateZiwei(id, rating, feedback);
                setZiweis(ziweis.map(t => t._id === id ? { ...t, rating, feedback } : t));
            } else if (type === 'marriage') {
                await rateMarriage(id, rating, feedback);
                setMarriages(marriages.map(m => m._id === id ? { ...m, rating, feedback } : m));
            }
            const cacheKey = `${type === 'iching' ? 'iching' : type === 'bazi' ? 'bazi' : type === 'ziwei' ? 'ziwei' : 'marriage'}:${id}`;
            delete prefetchedDetails.current[cacheKey];
            if (onCacheInvalidate) onCacheInvalidate();
        } catch (err) {
            console.error("Lỗi khi lưu đánh giá.", err);
        }
    };

    const handleDelete = async (type, id) => {
        showConfirm("Bạn có chắc chắn muốn xóa vĩnh viễn bản ghi này khỏi lịch sử không?", async () => {
            try {
                await deleteCalculation(type, id);
                if (type === 'iching' || type === 'hexagrams') {
                    setHexagrams(hexagrams.filter(h => h._id !== id));
                } else if (type === 'bazi') {
                    setBazis(bazis.filter(b => b._id !== id));
                } else if (type === 'ziwei') {
                    setZiweis(ziweis.filter(t => t._id !== id));
                } else if (type === 'marriage') {
                    setMarriages(marriages.filter(m => m._id !== id));
                }
                const cacheKey = `${type === 'iching' || type === 'hexagrams' ? 'iching' : type === 'bazi' ? 'bazi' : type === 'ziwei' ? 'ziwei' : 'marriage'}:${id}`;
                delete prefetchedDetails.current[cacheKey];
                if (onCacheInvalidate) onCacheInvalidate();
                showAlert("Xóa bản ghi lịch sử thành công.", "success");
            } catch (err) {
                console.error("Lỗi khi xóa bản ghi lịch sử:", err);
                showAlert("Không thể xóa bản ghi này. Vui lòng thử lại sau.", "error");
            }
        });
    };

    const handleTogglePin = async (type, id) => {
        try {
            const res = await pinCalculation(type, id);
            const isPinned = !!res.data.isPinned;
            
            const updateList = (list) => {
                const updated = list.map(item => item._id === id ? { ...item, isPinned } : item);
                return [...updated].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.dateCast || b.createdAt) - new Date(a.dateCast || a.createdAt));
            };
            
            if (type === 'iching' || type === 'hexagrams') {
                setHexagrams(updateList(hexagrams));
            } else if (type === 'bazi') {
                setBazis(updateList(bazis));
            } else if (type === 'ziwei') {
                setZiweis(updateList(ziweis));
            } else if (type === 'marriage') {
                setMarriages(updateList(marriages));
            }
            
            if (onCacheInvalidate) onCacheInvalidate();
        } catch (err) {
            console.error("Lỗi khi ghim bản ghi:", err);
            showAlert("Không thể ghim bản ghi này. Vui lòng thử lại sau.", "error");
        }
    };

    const handleTogglePublic = async (type, id, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await togglePublicCalculation(type === 'hexagrams' ? 'iching' : type, id, newStatus);
            
            const updatePublicInList = (list) => {
                return list.map(item => item._id === id ? { ...item, isPublic: newStatus } : item);
            };

            if (type === 'iching' || type === 'hexagrams') {
                setHexagrams(prev => updatePublicInList(prev));
            } else if (type === 'bazi') {
                setBazis(prev => updatePublicInList(prev));
            } else if (type === 'ziwei') {
                setZiweis(prev => updatePublicInList(prev));
            } else if (type === 'marriage') {
                setMarriages(prev => updatePublicInList(prev));
            }

            if (preloadedData) {
                const updatedPreloaded = { ...preloadedData };
                let key = '';
                if (type === 'iching' || type === 'hexagrams') key = 'hexagrams';
                else if (type === 'bazi') key = 'bazis';
                else if (type === 'ziwei') key = 'tuvis';
                else if (type === 'marriage') key = 'marriages';

                if (key && updatedPreloaded[key]) {
                    updatedPreloaded[key] = updatePublicInList(updatedPreloaded[key]);
                }
                if (onSaveCache) onSaveCache(updatedPreloaded);
            }
            
            setToastMsg(`Đã ${newStatus ? 'bật' : 'tắt'} chia sẻ công khai thành công.`);
        } catch (err) {
            console.error("Lỗi khi đổi trạng thái công khai:", err);
            setToastMsg("Không thể thay đổi trạng thái chia sẻ. Vui lòng thử lại sau.");
        }
    };

    const handleCopyLink = (type, id) => {
        const resolvedType = type === 'hexagrams' ? 'iching' : type;
        const shareUrl = `${window.location.origin}/${resolvedType}/record/${id}`;
        navigator.clipboard.writeText(shareUrl);
        setToastMsg("Đã sao chép liên kết chia sẻ công khai!");
    };

    if (!user) return <div className="text-center p-10">Vui lòng đăng nhập để xem lịch sử.</div>;
    if (loading) {
        return (
            <div className="bg-white p-12 md:p-20 rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[350px] animate-in fade-in duration-300">
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-16 h-16 bg-amber-50 rounded-full blur-xl animate-pulse"></div>
                    <Loader2 className="w-12 h-12 text-amber-800 animate-spin relative z-10" />
                </div>
            </div>
        );
    }

    const renderStars = (currentRating, onRate) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button 
                        key={star} 
                        onClick={() => onRate(star)}
                        className={`${star <= (currentRating || 0) ? 'text-amber-500' : 'text-gray-300'} hover:text-amber-400 transition-colors`}
                    >
                        <Star size={16} fill={star <= (currentRating || 0) ? "currentColor" : "none"} />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100 max-w-4xl mx-auto relative">
            {actionLoading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <Loader2 className="w-10 h-10 text-amber-800 animate-spin" />
                </div>
            )}
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-955 mb-6 md:mb-8 text-center border-b pb-4">Lịch Sử Của Bạn</h2>
            
            <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 md:gap-4 mb-6 md:mb-8">
                <button 
                    onClick={() => setActiveTab('iching')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs md:text-base rounded-full font-bold transition-all ${activeTab === 'iching' ? 'bg-amber-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Kinh Dịch ({hexagrams.length})
                </button>
                <button 
                    onClick={() => setActiveTab('bazi')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs md:text-base rounded-full font-bold transition-all ${activeTab === 'bazi' ? 'bg-blue-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Bát Tự ({bazis.length})
                </button>
                <button 
                    onClick={() => setActiveTab('ziwei')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs md:text-base rounded-full font-bold transition-all ${activeTab === 'ziwei' ? 'bg-purple-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Tử Vi ({ziweis.length})
                </button>
                <button 
                    onClick={() => setActiveTab('marriage')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs md:text-base rounded-full font-bold transition-all ${activeTab === 'marriage' ? 'bg-rose-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Hôn Nhân ({marriages.length})
                </button>
            </div>

            {/* Bộ lọc ngày lập */}
            <div className={`mb-8 p-5 rounded-3xl border ${activeTheme.border} bg-gradient-to-br from-gray-50/90 to-white/95 shadow-sm backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 transition-all duration-500 hover:shadow-md`}>
                {/* Tiêu đề bộ lọc */}
                <div className="flex items-center gap-3.5 flex-shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${
                        activeTab === 'iching' ? 'bg-amber-50 text-amber-800' : activeTab === 'bazi' ? 'bg-blue-50 text-blue-800' : activeTab === 'ziwei' ? 'bg-purple-50 text-purple-800' : 'bg-rose-50 text-rose-800'
                    }`}>
                        <Calendar size={24} className="animate-pulse" />
                    </div>
                    <span className="text-lg md:text-xl font-extrabold text-gray-800 leading-none">Bộ lọc thời gian</span>
                </div>
                
                {/* Khu vực controls xếp 2 hàng thẳng tắp bên phải */}
                <div className="flex flex-col gap-3.5 items-stretch lg:items-end flex-grow w-full lg:w-auto">
                    {/* Hàng 1: Các nút lọc nhanh */}
                    <div className="flex items-center bg-gray-100/60 p-1.5 rounded-2xl gap-1 w-full lg:w-auto overflow-x-auto scrollbar-none flex-nowrap justify-between sm:justify-start">
                        <button
                            type="button"
                            onClick={() => handleQuickFilter('today')}
                            className={`flex-shrink-0 flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                                activeQuickFilter === 'today'
                                    ? activeTab === 'iching' ? 'bg-amber-800 text-white shadow-sm scale-105' : activeTab === 'bazi' ? 'bg-blue-800 text-white shadow-sm scale-105' : activeTab === 'ziwei' ? 'bg-purple-800 text-white shadow-sm scale-105' : 'bg-rose-800 text-white shadow-sm scale-105'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
                            }`}
                        >
                            Hôm nay
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickFilter('yesterday')}
                            className={`flex-shrink-0 flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                                activeQuickFilter === 'yesterday'
                                    ? activeTab === 'iching' ? 'bg-amber-800 text-white shadow-sm scale-105' : activeTab === 'bazi' ? 'bg-blue-800 text-white shadow-sm scale-105' : activeTab === 'ziwei' ? 'bg-purple-800 text-white shadow-sm scale-105' : 'bg-rose-800 text-white shadow-sm scale-105'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
                            }`}
                        >
                            Hôm qua
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickFilter('7days')}
                            className={`flex-shrink-0 flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                                activeQuickFilter === '7days'
                                    ? activeTab === 'iching' ? 'bg-amber-800 text-white shadow-sm scale-105' : activeTab === 'bazi' ? 'bg-blue-800 text-white shadow-sm scale-105' : activeTab === 'ziwei' ? 'bg-purple-800 text-white shadow-sm scale-105' : 'bg-rose-800 text-white shadow-sm scale-105'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
                            }`}
                        >
                            7 ngày qua
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickFilter('30days')}
                            className={`flex-shrink-0 flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                                activeQuickFilter === '30days'
                                    ? activeTab === 'iching' ? 'bg-amber-800 text-white shadow-sm scale-105' : activeTab === 'bazi' ? 'bg-blue-800 text-white shadow-sm scale-105' : activeTab === 'ziwei' ? 'bg-purple-800 text-white shadow-sm scale-105' : 'bg-rose-800 text-white shadow-sm scale-105'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
                            }`}
                        >
                            30 ngày qua
                        </button>
                    </div>

                    {/* Hàng 2: Bộ lịch chọn thủ công và nút đặt lại */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow sm:flex-grow-0">
                            <CustomDatePicker
                                value={startDate}
                                onChange={(val) => {
                                    setStartDate(val);
                                    setActiveQuickFilter('');
                                    setCurrentPage(1);
                                }}
                                label="Từ:"
                                activeTheme={activeTheme}
                                activeTab={activeTab}
                                align="left"
                                maxDate={endDate}
                            />
                            <CustomDatePicker
                                value={endDate}
                                onChange={(val) => {
                                    setEndDate(val);
                                    setActiveQuickFilter('');
                                    setCurrentPage(1);
                                }}
                                label="Đến:"
                                activeTheme={activeTheme}
                                activeTab={activeTab}
                                align="right"
                                minDate={startDate}
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                    setActiveQuickFilter('');
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2.5 text-xs font-bold text-red-500 hover:text-red-750 hover:bg-red-50/80 rounded-2xl transition-all border border-red-100 bg-white shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center flex-shrink-0"
                            >
                                Đặt lại
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {activeTab === 'iching' && hexagrams.length === 0 && <p className="text-center text-gray-500">Chưa có quẻ nào được gieo.</p>}
                {activeTab === 'iching' && paginatedList.map((record) => (
                    <div 
                        key={record._id} 
                        onClick={() => handleViewHexagramDetail(record)} 
                        onMouseEnter={() => preloadRecord('iching', record._id)}
                        onTouchStart={() => preloadRecord('iching', record._id)}
                        className={`border ${record.isPinned ? 'border-amber-300 bg-amber-50/45 shadow-sm' : 'border-amber-100 bg-amber-50/20'} rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer`}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                            <div className="space-y-1.5 flex-1 min-w-0">
                                <h3 className="font-bold text-base sm:text-lg text-amber-900 break-words">{record.primaryHexagram.name} {record.transformedHexagram?.name ? `→ ${record.transformedHexagram.name}` : ''}</h3>
                                <p className="text-xs sm:text-sm text-slate-650 italic break-words">Hỏi: {record.question}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1.5">
                                        <Clock size={12}/> 
                                        {new Date(record.dateCast).toLocaleString('vi-VN')}
                                    </span>
                                    {record.isPinned && (
                                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                            Đã ghim
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-start shrink-0" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1.5 mr-1">
                                    <span className="text-[10px] font-bold text-slate-500 hidden md:inline">Chia sẻ:</span>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePublic('iching', record._id, record.isPublic)}
                                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${record.isPublic ? 'bg-amber-600' : 'bg-gray-300'}`}
                                        title={record.isPublic ? "Đang chia sẻ công khai - Nhấp để tắt" : "Đã tắt chia sẻ - Nhấp để bật"}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${record.isPublic ? 'translate-x-4' : 'translate-x-0'}`}
                                        />
                                    </button>
                                </div>
                                {record.isPublic && (
                                    <button 
                                        onClick={() => handleCopyLink('iching', record._id)} 
                                        className="p-1.5 rounded-xl hover:bg-amber-50 text-amber-700 hover:text-amber-850 transition-colors cursor-pointer"
                                        title="Sao chép liên kết chia sẻ công khai"
                                    >
                                        <Share2 size={15} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleTogglePin('iching', record._id)} 
                                    className={`p-1.5 rounded-xl transition-colors hover:bg-amber-50 ${record.isPinned ? 'text-amber-600' : 'text-slate-350 hover:text-amber-500'}`}
                                    title={record.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
                                >
                                    <Pin size={15} className={record.isPinned ? 'fill-current' : ''} />
                                </button>
                                <button 
                                    onClick={() => handleViewHexagramDetail(record)} 
                                    className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-850 border border-amber-200/50 rounded-xl hover:bg-amber-100 transition-all text-xs font-bold shadow-sm"
                                >
                                    <Eye size={13} />
                                    <span className="hidden sm:inline">Xem chi tiết</span>
                                </button>
                                <button 
                                    onClick={() => handleDelete('iching', record._id)} 
                                    className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-750 transition-colors"
                                    title="Xóa vĩnh viễn"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Rating Section */}
                        <div onClick={(e) => e.stopPropagation()} className="mt-4 pt-4 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-default">
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs sm:text-sm font-bold text-slate-700">Độ chính xác:</span>
                                {renderStars(record.rating, (rating) => handleRate('iching', record._id, rating, document.getElementById(`feedback-hex-${record._id}`)?.value || record.feedback))}
                            </div>
                            <div className="w-full sm:flex-1 flex items-center gap-2">
                                <input 
                                    type="text" 
                                    id={`feedback-hex-${record._id}`}
                                    placeholder="Ghi chú ứng kỳ..." 
                                    className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-400 focus:outline-none transition-all"
                                    defaultValue={record.feedback}
                                  />
                                  <button 
                                      onClick={() => {
                                          const val = document.getElementById(`feedback-hex-${record._id}`).value;
                                          if (val !== record.feedback || !record.rating) {
                                              handleRate('iching', record._id, record.rating, val);
                                          }
                                      }}
                                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
                                  >
                                      Lưu
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
  
                  {activeTab === 'bazi' && bazis.length === 0 && <p className="text-center text-gray-500">Chưa có lá số nào được lập.</p>}
                  {activeTab === 'bazi' && paginatedList.map((record) => (
                      <div 
                          key={record._id} 
                          onClick={() => handleViewBaziDetail(record)} 
                          onMouseEnter={() => preloadRecord('bazi', record._id)}
                          onTouchStart={() => preloadRecord('bazi', record._id)}
                          className={`border ${record.isPinned ? 'border-blue-300 bg-blue-50/45 shadow-sm' : 'border-blue-100 bg-blue-50/20'} rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer`}
                      >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                  <h3 className="font-bold text-base sm:text-lg text-blue-905 break-words">
                                      {record.inputInfo?.name && !record.inputInfo.name.startsWith('Bát Tự -') && !record.inputInfo.name.startsWith('Tử Vi -') 
                                          ? record.inputInfo.name 
                                          : 'Lá số Bát Tự'} : {record.inputInfo.date} {record.inputInfo.time} ({record.inputInfo.gender === 1 ? 'Nam' : 'Nữ'})
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                                          <Calendar size={12}/> 
                                          Tiết khí: {record.tietKhiTimeline}
                                      </span>
                                      {record.isPinned && (
                                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                              Đã ghim
                                          </span>
                                      )}
                                  </div>
                              </div>
                              <div className="flex items-center gap-2 self-end sm:self-start shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-1.5 mr-1">
                                      <span className="text-[10px] font-bold text-slate-500 hidden md:inline">Chia sẻ:</span>
                                      <button
                                          type="button"
                                          onClick={() => handleTogglePublic('bazi', record._id, record.isPublic)}
                                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${record.isPublic ? 'bg-emerald-600' : 'bg-gray-300'}`}
                                          title={record.isPublic ? "Đang chia sẻ công khai - Nhấp để tắt" : "Đã tắt chia sẻ - Nhấp để bật"}
                                      >
                                          <span
                                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${record.isPublic ? 'translate-x-4' : 'translate-x-0'}`}
                                          />
                                      </button>
                                  </div>
                                  {record.isPublic && (
                                      <button 
                                          onClick={() => handleCopyLink('bazi', record._id)} 
                                          className="p-1.5 rounded-xl hover:bg-blue-50 text-blue-800 hover:text-blue-900 transition-colors cursor-pointer"
                                          title="Sao chép liên kết chia sẻ công khai"
                                      >
                                          <Share2 size={15} />
                                      </button>
                                  )}
                                  <button 
                                      onClick={() => handleTogglePin('bazi', record._id)} 
                                      className={`p-1.5 rounded-xl transition-colors hover:bg-blue-50 ${record.isPinned ? 'text-blue-600' : 'text-slate-350 hover:text-blue-500'}`}
                                      title={record.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
                                  >
                                      <Pin size={15} className={record.isPinned ? 'fill-current' : ''} />
                                  </button>
                                  <button 
                                      onClick={() => handleViewBaziDetail(record)} 
                                      className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-850 border border-blue-200/50 rounded-xl hover:bg-blue-100 transition-all text-xs font-bold shadow-sm"
                                  >
                                      <Eye size={13} />
                                      <span className="hidden sm:inline">Xem chi tiết</span>
                                  </button>
                                  <button 
                                      onClick={() => handleDelete('bazi', record._id)} 
                                      className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-750 transition-colors"
                                      title="Xóa vĩnh viễn"
                                  >
                                      <Trash2 size={15} />
                                  </button>
                              </div>
                          </div>
                          
                          {/* Rating Section */}
                          <div onClick={(e) => e.stopPropagation()} className="mt-4 pt-4 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-default">
                              <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs sm:text-sm font-bold text-slate-700">Đánh giá:</span>
                                  {renderStars(record.rating, (rating) => handleRate('bazi', record._id, rating, document.getElementById(`feedback-bazi-${record._id}`)?.value || record.feedback))}
                              </div>
                              <div className="w-full sm:flex-1 flex items-center gap-2">
                                  <input 
                                      type="text" 
                                      id={`feedback-bazi-${record._id}`}
                                      placeholder="Nhận xét..." 
                                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none transition-all"
                                      defaultValue={record.feedback}
                                  />
                                  <button 
                                      onClick={() => {
                                          const val = document.getElementById(`feedback-bazi-${record._id}`).value;
                                          if (val !== record.feedback || !record.rating) {
                                              handleRate('bazi', record._id, record.rating, val);
                                          }
                                      }}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
                                  >
                                      Lưu
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
  
                  {activeTab === 'ziwei' && ziweis.length === 0 && <p className="text-center text-gray-500">Chưa có lá số Tử Vi nào được lập.</p>}
                  {activeTab === 'ziwei' && paginatedList.map((record) => (
                      <div 
                          key={record._id} 
                          onClick={() => onViewZiwei(record)} 
                          onMouseEnter={() => preloadRecord('ziwei', record._id)}
                          onTouchStart={() => preloadRecord('ziwei', record._id)}
                          className={`border ${record.isPinned ? 'border-purple-300 bg-purple-50/45 shadow-sm' : 'border-purple-100 bg-purple-50/20'} rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer`}
                      >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                  <h3 className="font-bold text-base sm:text-lg text-purple-900 break-words">
                                      {record.inputInfo?.name && !record.inputInfo.name.startsWith('Bát Tự -') && !record.inputInfo.name.startsWith('Tử Vi -') 
                                          ? record.inputInfo.name 
                                          : 'Lá số Tử Vi'} : {record.inputInfo?.date || ''} ({record.inputInfo?.gender || ''} Mệnh)
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                                          <Clock size={12}/> 
                                          Giờ sinh: {record.inputInfo?.hour !== undefined ? LUNAR_HOURS_MAP[record.inputInfo.hour] : ''}
                                      </span>
                                      {record.isPinned && (
                                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                              Đã ghim
                                          </span>
                                      )}
                                  </div>
                              </div>
                              <div className="flex items-center gap-2 self-end sm:self-start shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-1.5 mr-1">
                                      <span className="text-[10px] font-bold text-slate-500 hidden md:inline">Chia sẻ:</span>
                                      <button
                                          type="button"
                                          onClick={() => handleTogglePublic('ziwei', record._id, record.isPublic)}
                                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${record.isPublic ? 'bg-purple-600' : 'bg-gray-300'}`}
                                          title={record.isPublic ? "Đang chia sẻ công khai - Nhấp để tắt" : "Đã tắt chia sẻ - Nhấp để bật"}
                                      >
                                          <span
                                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${record.isPublic ? 'translate-x-4' : 'translate-x-0'}`}
                                          />
                                      </button>
                                  </div>
                                  {record.isPublic && (
                                      <button 
                                          onClick={() => handleCopyLink('ziwei', record._id)} 
                                          className="p-1.5 rounded-xl hover:bg-purple-50 text-purple-800 hover:text-purple-900 transition-colors cursor-pointer"
                                          title="Sao chép liên kết chia sẻ công khai"
                                      >
                                          <Share2 size={15} />
                                      </button>
                                  )}
                                  <button 
                                      onClick={() => handleTogglePin('ziwei', record._id)} 
                                      className={`p-1.5 rounded-xl transition-colors hover:bg-purple-50 ${record.isPinned ? 'text-purple-600' : 'text-slate-350 hover:text-purple-500'}`}
                                      title={record.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
                                  >
                                      <Pin size={15} className={record.isPinned ? 'fill-current' : ''} />
                                  </button>
                                  <button 
                                      onClick={() => onViewZiwei(record)} 
                                      className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-855 border border-purple-200/50 rounded-xl hover:bg-purple-100 transition-all text-xs font-bold shadow-sm"
                                  >
                                      <Eye size={13} />
                                      <span className="hidden sm:inline">Xem chi tiết</span>
                                  </button>
                                  <button 
                                      onClick={() => handleDelete('ziwei', record._id)} 
                                      className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-755 transition-colors"
                                      title="Xóa vĩnh viễn"
                                  >
                                      <Trash2 size={15} />
                                  </button>
                              </div>
                          </div>
                          
                          {/* Rating Section */}
                          <div onClick={(e) => e.stopPropagation()} className="mt-4 pt-4 border-t border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-default">
                              <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs sm:text-sm font-bold text-slate-700">Đánh giá:</span>
                                  {renderStars(record.rating, (rating) => handleRate('ziwei', record._id, rating, document.getElementById(`feedback-ziwei-${record._id}`)?.value || record.feedback))}
                              </div>
                              <div className="w-full sm:flex-1 flex items-center gap-2">
                                  <input 
                                      type="text" 
                                      id={`feedback-ziwei-${record._id}`}
                                      placeholder="Nhận xét..." 
                                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-400 focus:outline-none transition-all"
                                      defaultValue={record.feedback}
                                  />
                                  <button 
                                      onClick={() => {
                                          const val = document.getElementById(`feedback-ziwei-${record._id}`).value;
                                          if (val !== record.feedback || !record.rating) {
                                              handleRate('ziwei', record._id, record.rating, val);
                                          }
                                      }}
                                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
                                  >
                                      Lưu
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}

                  {activeTab === 'marriage' && marriages.length === 0 && <p className="text-center text-gray-500">Chưa có bản ghi hợp hôn nào.</p>}
                  {activeTab === 'marriage' && paginatedList.map((record) => (
                      <div 
                          key={record._id} 
                          onClick={() => handleViewMarriageDetail(record)} 
                          onMouseEnter={() => preloadRecord('marriage', record._id)}
                          onTouchStart={() => preloadRecord('marriage', record._id)}
                          className={`border ${record.isPinned ? 'border-rose-300 bg-rose-50/45 shadow-sm' : 'border-rose-100 bg-rose-50/20'} rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer`}
                      >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                  <h3 className="font-bold text-base sm:text-lg text-rose-900 break-words">Hợp Hôn: Nam ({record.inputInfo?.male?.date || ''}) & Nữ ({record.inputInfo?.female?.date || ''})</h3>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1.5">
                                          <Clock size={12}/> 
                                          {new Date(record.createdAt).toLocaleString('vi-VN')}
                                      </span>
                                      {record.isPinned && (
                                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                              Đã ghim
                                          </span>
                                      )}
                                  </div>
                              </div>
                              <div className="flex items-center gap-2 self-end sm:self-start shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-1.5 mr-1">
                                      <span className="text-[10px] font-bold text-slate-500 hidden md:inline">Chia sẻ:</span>
                                      <button
                                          type="button"
                                          onClick={() => handleTogglePublic('marriage', record._id, record.isPublic)}
                                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${record.isPublic ? 'bg-rose-600' : 'bg-gray-300'}`}
                                          title={record.isPublic ? "Đang chia sẻ công khai - Nhấp để tắt" : "Đã tắt chia sẻ - Nhấp để bật"}
                                      >
                                          <span
                                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${record.isPublic ? 'translate-x-4' : 'translate-x-0'}`}
                                          />
                                      </button>
                                  </div>
                                  {record.isPublic && (
                                      <button 
                                          onClick={() => handleCopyLink('marriage', record._id)} 
                                          className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-800 hover:text-rose-900 transition-colors cursor-pointer"
                                          title="Sao chép liên kết chia sẻ công khai"
                                      >
                                          <Share2 size={15} />
                                      </button>
                                  )}
                                  <button 
                                      onClick={() => handleTogglePin('marriage', record._id)} 
                                      className={`p-1.5 rounded-xl transition-colors hover:bg-rose-50 ${record.isPinned ? 'text-rose-600' : 'text-slate-350 hover:text-rose-500'}`}
                                      title={record.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
                                  >
                                      <Pin size={15} className={record.isPinned ? 'fill-current' : ''} />
                                  </button>
                                  <button 
                                      onClick={() => handleViewMarriageDetail(record)} 
                                      className="flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-850 border border-rose-200/50 rounded-xl hover:bg-rose-100 transition-all text-xs font-bold shadow-sm"
                                  >
                                      <Eye size={13} />
                                      <span className="hidden sm:inline">Xem chi tiết</span>
                                  </button>
                                  <button 
                                      onClick={() => handleDelete('marriage', record._id)} 
                                      className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-755 transition-colors"
                                      title="Xóa vĩnh viễn"
                                  >
                                      <Trash2 size={15} />
                                  </button>
                              </div>
                          </div>
                          
                          {/* Rating Section */}
                          <div onClick={(e) => e.stopPropagation()} className="mt-4 pt-4 border-t border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-default">
                              <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs sm:text-sm font-bold text-slate-700">Đánh giá:</span>
                                  {renderStars(record.rating, (rating) => handleRate('marriage', record._id, rating, document.getElementById(`feedback-marr-${record._id}`)?.value || record.feedback))}
                              </div>
                              <div className="w-full sm:flex-1 flex items-center gap-2">
                                  <input 
                                      type="text" 
                                      id={`feedback-marr-${record._id}`}
                                      placeholder="Nhận xét..." 
                                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-400 focus:outline-none transition-all"
                                      defaultValue={record.feedback}
                                  />
                                  <button 
                                      onClick={() => {
                                          const val = document.getElementById(`feedback-marr-${record._id}`).value;
                                          if (val !== record.feedback || !record.rating) {
                                              handleRate('marriage', record._id, record.rating, val);
                                          }
                                      }}
                                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
                                  >
                                      Lưu
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-gray-100 animate-in fade-in duration-300">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            currentPage === 1 
                                ? 'border-gray-150 text-gray-300 cursor-not-allowed bg-gray-50' 
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95'
                        }`}
                    >
                        Trang trước
                    </button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                            if (totalPages > 5 && page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                                if (page === 2 && currentPage > 3) return <span key="dots-start" className="text-gray-400 px-1 text-xs">...</span>;
                                if (page === totalPages - 1 && currentPage < totalPages - 2) return <span key="dots-end" className="text-gray-400 px-1 text-xs">...</span>;
                                return null;
                            }
                            
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all active:scale-95 ${
                                        currentPage === page
                                            ? `${activeTheme.bg} text-white shadow-md`
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            currentPage === totalPages 
                                ? 'border-gray-150 text-gray-300 cursor-not-allowed bg-gray-50' 
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95'
                        }`}
                    >
                        Trang sau
                    </button>
                </div>
            )}

            {/* CUSTOM CONFIRMATION AND NOTIFICATION DIALOG */}
            {dialog && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
                        <button
                            type="button"
                            onClick={() => setDialog(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <h3 className={`text-lg font-bold flex items-center gap-2 ${dialog.type === 'confirm' ? 'text-amber-600' : dialog.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {dialog.type === 'confirm' ? (
                                <>
                                    <Info size={20} />
                                    Xác Nhận Xóa
                                </>
                            ) : dialog.type === 'error' ? (
                                <>
                                    <AlertTriangle size={20} />
                                    Lỗi
                                </>
                            ) : (
                                <>
                                    <Check size={20} />
                                    Thành Công
                                </>
                            )}
                        </h3>

                        <p className="text-sm text-gray-600 leading-relaxed">
                            {dialog.message}
                        </p>

                        <div className="flex gap-2 justify-end pt-2">
                            {dialog.type === 'confirm' ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setDialog(null)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-xs"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (dialog.onConfirm) {
                                                dialog.onConfirm();
                                            }
                                            setDialog(null);
                                        }}
                                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-xs shadow-lg shadow-red-100"
                                    >
                                        Xác nhận
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    className={`px-5 py-2 ${activeTheme.bg} text-white font-bold rounded-xl transition-colors text-xs`}
                                >
                                    Đóng
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {toastMsg && <FloatingNotificationToast message={toastMsg} onClose={() => setToastMsg('')} />}
        </div>
    );
};

export default HistoryBoard;

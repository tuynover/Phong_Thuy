import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { getIChingHistory, getBaziHistory, getZiweiHistory, getMarriageHistory, rateIChing, rateBazi, rateZiwei, rateMarriage, deleteCalculation, getIChingRecord, getBaziRecord, getZiweiRecord, getMarriageRecord, pinCalculation, togglePublicCalculation, getUserTags, updateRecordTags, createTag } from '@/services/api';
import { Star, Clock, Calendar, Trash2, X, Info, Check, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Pin, Eye, Share2, Tag, Filter, Search, Globe, Plus, Folder, User, ChevronDown, ChevronUp } from 'lucide-react';
import FloatingNotificationToast from '@/components/common/FloatingNotificationToast';
import CustomSelect from '@/components/common/CustomSelect';
import CustomDatePicker from '@/components/common/CustomDatePicker';
import IChingHistoryCard from './components/IChingHistoryCard';
import BaziHistoryCard from './components/BaziHistoryCard';
import ZiweiHistoryCard from './components/ZiweiHistoryCard';
import MarriageHistoryCard from './components/MarriageHistoryCard';

const LUNAR_HOURS_MAP = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"
];

const HISTORY_SLUG_MAP = {
  'kinh-dich': 'iching',
  'iching': 'iching',
  'bat-tu': 'bazi',
  'bazi': 'bazi',
  'tu-vi': 'ziwei',
  'ziwei': 'ziwei',
  'hon-nhan': 'marriage',
  'marriage': 'marriage'
};

const TAB_TO_HISTORY_SLUG = {
  'iching': 'kinh-dich',
  'bazi': 'bat-tu',
  'ziwei': 'tu-vi',
  'marriage': 'hon-nhan'
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

    const getInitialHistoryTab = () => {
        if (typeof window !== 'undefined') {
            const match = window.location.pathname.match(/^\/history\/([a-zA-Z0-9_-]+)/);
            if (match && HISTORY_SLUG_MAP[match[1]]) {
                return HISTORY_SLUG_MAP[match[1]];
            }
        }
        return 'iching';
    };

    const [activeTab, setActiveTab] = useState(getInitialHistoryTab); // 'iching' | 'bazi' | 'ziwei' | 'marriage'

    const handleTabSwitch = (newTab) => {
        setActiveTab(newTab);
        setCurrentPage(1);
        const slug = TAB_TO_HISTORY_SLUG[newTab];
        if (slug) {
            const targetUrl = `/history/${slug}`;
            if (window.location.pathname !== targetUrl) {
                window.history.pushState({ path: targetUrl }, '', targetUrl);
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
        }
    };

    useEffect(() => {
        const onPopState = () => {
            if (window.location.pathname.startsWith('/history')) {
                const match = window.location.pathname.match(/^\/history\/([a-zA-Z0-9_-]+)/);
                if (match && HISTORY_SLUG_MAP[match[1]]) {
                    setActiveTab(HISTORY_SLUG_MAP[match[1]]);
                } else if (window.location.pathname === '/history') {
                    setActiveTab('iching');
                }
            }
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/history') {
            const slug = TAB_TO_HISTORY_SLUG[activeTab] || 'kinh-dich';
            window.history.replaceState({ path: `/history/${slug}` }, '', `/history/${slug}`);
        }
    }, []);
    const [dialog, setDialog] = useState(null); // { type: 'confirm' | 'success' | 'error', message: '', onConfirm: null }
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeQuickFilter, setActiveQuickFilter] = useState('');

    const [userTags, setUserTags] = useState([]);
    const [selectedTagFilter, setSelectedTagFilter] = useState('all');
    const [isPublicFilter, setIsPublicFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [birthDayFilter, setBirthDayFilter] = useState('');
    const [birthMonthFilter, setBirthMonthFilter] = useState('');
    const [birthYearFilter, setBirthYearFilter] = useState('');
    const [birthHourFilter, setBirthHourFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [tagModalRecord, setTagModalRecord] = useState(null);
    const [newTagName, setNewTagName] = useState('');
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const isFilterModified = Boolean(
        startDate || endDate || activeQuickFilter ||
        (selectedTagFilter && selectedTagFilter !== 'all') ||
        (isPublicFilter && isPublicFilter !== 'all') ||
        (genderFilter && genderFilter !== 'all') ||
        birthDayFilter || birthMonthFilter || birthYearFilter ||
        (birthHourFilter !== undefined && birthHourFilter !== '') ||
        searchQuery
    );

    const handleQuickFilter = (type) => {
        const end = new Date();
        const start = new Date();
        const todayStr = end.getFullYear() + '-' + String(end.getMonth() + 1).padStart(2, '0') + '-' + String(end.getDate()).padStart(2, '0');

        if (type === 'today') {
            setStartDate(todayStr);
            setEndDate(todayStr);
            setActiveQuickFilter('today');
            handleApplyFilter({ startDate: todayStr, endDate: todayStr });
        } else if (type === 'yesterday') {
            start.setDate(end.getDate() - 1);
            const yesterdayStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
            setStartDate(yesterdayStr);
            setEndDate(yesterdayStr);
            setActiveQuickFilter('yesterday');
            handleApplyFilter({ startDate: yesterdayStr, endDate: yesterdayStr });
        } else if (type === '7days') {
            start.setDate(end.getDate() - 7);
            const startStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
            setStartDate(startStr);
            setEndDate(todayStr);
            setActiveQuickFilter('7days');
            handleApplyFilter({ startDate: startStr, endDate: todayStr });
        } else if (type === '30days') {
            start.setDate(end.getDate() - 30);
            const startStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
            setStartDate(startStr);
            setEndDate(todayStr);
            setActiveQuickFilter('30days');
            handleApplyFilter({ startDate: startStr, endDate: todayStr });
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
        window.scrollTo(0, 0);
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

    const handleApplyFilter = (overrideParams = {}) => {
        setCurrentPage(1);
        const filters = {
            startDate: overrideParams.startDate !== undefined ? overrideParams.startDate : startDate,
            endDate: overrideParams.endDate !== undefined ? overrideParams.endDate : endDate,
            tag: overrideParams.tag !== undefined ? overrideParams.tag : selectedTagFilter,
            isPublic: overrideParams.isPublic !== undefined ? overrideParams.isPublic : isPublicFilter,
            gender: overrideParams.gender !== undefined ? overrideParams.gender : genderFilter,
            birthDay: overrideParams.birthDay !== undefined ? overrideParams.birthDay : birthDayFilter,
            birthMonth: overrideParams.birthMonth !== undefined ? overrideParams.birthMonth : birthMonthFilter,
            birthYear: overrideParams.birthYear !== undefined ? overrideParams.birthYear : birthYearFilter,
            birthHour: overrideParams.birthHour !== undefined ? overrideParams.birthHour : birthHourFilter,
            search: overrideParams.search !== undefined ? overrideParams.search : searchQuery
        };
        fetchData(filters);
    };

    useEffect(() => {
        if (user) {
            getUserTags().then(res => setUserTags(res.data || [])).catch(() => {});
            handleApplyFilter();
        }
    }, [user]);

    const resetAllFilters = () => {
        setStartDate('');
        setEndDate('');
        setActiveQuickFilter('');
        setSelectedTagFilter('all');
        setIsPublicFilter('all');
        setGenderFilter('all');
        setBirthDayFilter('');
        setBirthMonthFilter('');
        setBirthYearFilter('');
        setBirthHourFilter('');
        setSearchQuery('');
        setCurrentPage(1);
        fetchData({});
    };

    const handleSaveRecordTags = async (recordType, recordId, selectedTagNames) => {
        setActionLoading(true);
        try {
            await updateRecordTags(recordType, recordId, selectedTagNames);
            const updateList = (list) => list.map(item => item._id === recordId ? { ...item, tags: selectedTagNames } : item);
            if (recordType === 'iching') setHexagrams(updateList);
            else if (recordType === 'bazi') setBazis(updateList);
            else if (recordType === 'ziwei') setZiweis(updateList);
            else if (recordType === 'marriage') setMarriages(updateList);
            setToastMsg("Đã cập nhật thẻ thành công.");
        } catch (err) {
            setToastMsg(err.response?.data?.error || "Không thể cập nhật thẻ.");
        } finally {
            setActionLoading(false);
            setTagModalRecord(null);
        }
    };

    const handleCreateNewTagInModal = async () => {
        if (!newTagName.trim()) return;
        const cleanName = newTagName.trim();
        setActionLoading(true);
        try {
            const res = await createTag(cleanName);
            const createdTag = res.data;
            setUserTags(prev => [...prev.filter(t => t.name !== createdTag.name), createdTag]);
            const currentTags = tagModalRecord?.record?.tags || ['Chung'];
            const newTags = [...new Set([...currentTags, createdTag.name])];
            setTagModalRecord(prev => prev ? { ...prev, record: { ...prev.record, tags: newTags } } : null);
            setNewTagName('');
            setToastMsg(`Đã tạo thẻ "${createdTag.name}" và chọn cho lá số.`);
        } catch (err) {
            setToastMsg(err.response?.data?.error || "Không thể tạo thẻ mới.");
        } finally {
            setActionLoading(false);
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
            if (filters.tag && filters.tag !== 'all') params.tag = filters.tag;
            if (filters.isPublic && filters.isPublic !== 'all') params.isPublic = filters.isPublic;
            if (filters.gender && filters.gender !== 'all') params.gender = filters.gender;
            if (filters.birthDay) params.birthDay = filters.birthDay;
            if (filters.birthMonth) params.birthMonth = filters.birthMonth;
            if (filters.birthYear) params.birthYear = filters.birthYear;
            if (filters.birthHour !== undefined && filters.birthHour !== '') params.birthHour = filters.birthHour;
            if (filters.search) params.search = filters.search;

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
                    onClick={() => handleTabSwitch('iching')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs md:text-base rounded-full font-bold transition-all ${activeTab === 'iching' ? 'bg-amber-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Kinh Dịch ({user?.stats?.ichingCount !== undefined ? user.stats.ichingCount : hexagrams.length})
                </button>
                <button 
                    onClick={() => handleTabSwitch('bazi')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs md:text-base rounded-full font-bold transition-all ${activeTab === 'bazi' ? 'bg-blue-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Bát Tự ({user?.stats?.baziCount !== undefined ? user.stats.baziCount : bazis.length})
                </button>
                <button 
                    onClick={() => handleTabSwitch('ziwei')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs md:text-base rounded-full font-bold transition-all ${activeTab === 'ziwei' ? 'bg-purple-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Tử Vi ({user?.stats?.ziweiCount !== undefined ? user.stats.ziweiCount : ziweis.length})
                </button>
                <button 
                    onClick={() => handleTabSwitch('marriage')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs md:text-base rounded-full font-bold transition-all ${activeTab === 'marriage' ? 'bg-rose-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Hôn Nhân ({user?.stats?.marriageCount !== undefined ? user.stats.marriageCount : marriages.length})
                </button>
            </div>

            {/* Section Bộ Lọc Tìm Kiếm */}
            <div className={`mb-8 p-5 sm:p-6 rounded-3xl border ${activeTheme.border} bg-gradient-to-br from-gray-50/90 to-white/95 shadow-sm backdrop-blur-md space-y-4 transition-all duration-500 hover:shadow-md`}>
                {/* Header Bộ Lọc */}
                <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
                            activeTab === 'iching' ? 'bg-amber-100 text-amber-800' : activeTab === 'bazi' ? 'bg-blue-100 text-blue-800' : activeTab === 'ziwei' ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                            <Filter size={18} />
                        </div>
                        <h3 className="font-extrabold text-slate-850 text-base">Bộ Lọc Tìm Kiếm</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={resetAllFilters}
                            disabled={!isFilterModified}
                            className="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white rounded-2xl transition-all border border-red-100 bg-white shadow-2xs cursor-pointer"
                        >
                            Đặt lại
                        </button>
                        <button
                            type="button"
                            onClick={() => handleApplyFilter()}
                            disabled={!isFilterModified}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                            <Search size={14} />
                            <span>Tìm kiếm</span>
                        </button>
                    </div>
                </div>

                {/* Hàng Lọc Cơ Bản Theo Thời Gian */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Phím tắt lọc nhanh */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        <span className="text-xs font-bold text-slate-500 shrink-0">Lập quẻ / lá số:</span>
                        <button
                            type="button"
                            onClick={() => handleQuickFilter('today')}
                            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${activeQuickFilter === 'today' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Hôm nay
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickFilter('yesterday')}
                            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${activeQuickFilter === 'yesterday' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Hôm qua
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickFilter('7days')}
                            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${activeQuickFilter === '7days' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            7 ngày qua
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickFilter('30days')}
                            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${activeQuickFilter === '30days' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            30 ngày qua
                        </button>
                    </div>

                    {/* Chọn ngày thủ công */}
                    <div className="flex items-center gap-2 shrink-0">
                        <CustomDatePicker
                            value={startDate}
                            onChange={(val) => {
                                setStartDate(val);
                                setActiveQuickFilter('');
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
                            }}
                            label="Đến:"
                            activeTheme={activeTheme}
                            activeTab={activeTab}
                            align="right"
                            minDate={startDate}
                        />
                    </div>
                </div>

                {/* Phần Lọc Nâng Cao (Mở rộng / Thu gọn) */}
                {isAdvancedOpen && (
                    <div className="pt-3 border-t border-slate-200/60 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            {/* Search */}
                            <div className="relative">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                                    placeholder="Tìm theo tên / câu hỏi..."
                                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-2xl bg-white font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs shadow-2xs"
                                />
                            </div>

                            {/* Tag Filter */}
                            <div>
                                <CustomSelect
                                    value={selectedTagFilter}
                                    onChange={(val) => setSelectedTagFilter(val)}
                                    icon={Folder}
                                    options={[
                                        { value: 'all', label: 'Thư mục: Tất cả' },
                                        ...userTags.map(t => ({ value: t.name, label: `${t.name} (${t.counts?.total || 0})` }))
                                    ]}
                                />
                            </div>

                            {/* Public Status */}
                            <div>
                                <CustomSelect
                                    value={isPublicFilter}
                                    onChange={(val) => setIsPublicFilter(val)}
                                    icon={Globe}
                                    options={[
                                        { value: 'all', label: 'Chia sẻ: Tất cả' },
                                        { value: 'true', label: 'Đã chia sẻ (Public)' },
                                        { value: 'false', label: 'Riêng tư (Private)' }
                                    ]}
                                />
                            </div>

                            {/* Gender */}
                            <div>
                                <CustomSelect
                                    value={genderFilter}
                                    onChange={(val) => setGenderFilter(val)}
                                    icon={User}
                                    options={[
                                        { value: 'all', label: 'Giới tính: Tất cả' },
                                        { value: '1', label: 'Nam' },
                                        { value: '0', label: 'Nữ' }
                                    ]}
                                />
                            </div>

                            {/* Birth Day */}
                            <div>
                                <CustomSelect
                                    value={birthDayFilter}
                                    onChange={(val) => setBirthDayFilter(val)}
                                    placeholder="Ngày sinh (1 - 31)"
                                    editable={true}
                                    onKeyDown={() => handleApplyFilter()}
                                    options={Array.from({ length: 31 }, (_, i) => String(i + 1))}
                                />
                            </div>

                            {/* Birth Month */}
                            <div>
                                <CustomSelect
                                    value={birthMonthFilter}
                                    onChange={(val) => setBirthMonthFilter(val)}
                                    placeholder="Tháng sinh (1 - 12)"
                                    editable={true}
                                    onKeyDown={() => handleApplyFilter()}
                                    options={Array.from({ length: 12 }, (_, i) => String(i + 1))}
                                />
                            </div>

                            {/* Birth Year */}
                            <div>
                                <CustomSelect
                                    value={birthYearFilter}
                                    onChange={(val) => setBirthYearFilter(val)}
                                    placeholder="Năm sinh (VD: 1995)"
                                    editable={true}
                                    onKeyDown={() => handleApplyFilter()}
                                    options={Array.from({ length: 90 }, (_, i) => String(2026 - i))}
                                />
                            </div>

                            {/* Birth Hour */}
                            <div>
                                <CustomSelect
                                    value={birthHourFilter}
                                    onChange={(val) => setBirthHourFilter(val)}
                                    placeholder="Giờ sinh (0 - 23)"
                                    editable={true}
                                    onKeyDown={() => handleApplyFilter()}
                                    options={Array.from({ length: 24 }, (_, i) => String(i))}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Nút mũi tên mở rộng / thu gọn lọc nâng cao */}
                <div className="flex justify-center pt-1 border-t border-slate-200/50">
                    <button
                        type="button"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className="px-4 py-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 rounded-full transition-all flex items-center gap-1 cursor-pointer"
                        title={isAdvancedOpen ? "Thu gọn lọc nâng cao" : "Mở rộng lọc nâng cao"}
                    >
                        <span>{isAdvancedOpen ? 'Thu gọn lọc nâng cao' : 'Lọc nâng cao'}</span>
                        <ChevronDown size={16} className={`transition-transform duration-300 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {activeTab === 'iching' && hexagrams.length === 0 && <p className="text-center text-gray-500">Không có</p>}
                {activeTab === 'iching' && paginatedList.map((record) => (
                    <IChingHistoryCard
                        key={record._id}
                        record={record}
                        onView={handleViewHexagramDetail}
                        onPreload={preloadRecord}
                        onTogglePublic={handleTogglePublic}
                        onCopyLink={handleCopyLink}
                        onTogglePin={handleTogglePin}
                        onOpenTagModal={setTagModalRecord}
                        onDelete={handleDelete}
                        onRate={handleRate}
                        renderStars={renderStars}
                    />
                ))}

                {activeTab === 'bazi' && bazis.length === 0 && <p className="text-center text-gray-500">Không có</p>}
                {activeTab === 'bazi' && paginatedList.map((record) => (
                    <BaziHistoryCard
                        key={record._id}
                        record={record}
                        onView={handleViewBaziDetail}
                        onPreload={preloadRecord}
                        onTogglePublic={handleTogglePublic}
                        onCopyLink={handleCopyLink}
                        onTogglePin={handleTogglePin}
                        onOpenTagModal={setTagModalRecord}
                        onDelete={handleDelete}
                        onRate={handleRate}
                        renderStars={renderStars}
                    />
                ))}

                {activeTab === 'ziwei' && ziweis.length === 0 && <p className="text-center text-gray-500">Không có</p>}
                {activeTab === 'ziwei' && paginatedList.map((record) => (
                    <ZiweiHistoryCard
                        key={record._id}
                        record={record}
                        onView={onViewZiwei}
                        onPreload={preloadRecord}
                        onTogglePublic={handleTogglePublic}
                        onCopyLink={handleCopyLink}
                        onTogglePin={handleTogglePin}
                        onOpenTagModal={setTagModalRecord}
                        onDelete={handleDelete}
                        onRate={handleRate}
                        renderStars={renderStars}
                    />
                ))}

                {activeTab === 'marriage' && marriages.length === 0 && <p className="text-center text-gray-500">Không có</p>}
                {activeTab === 'marriage' && paginatedList.map((record) => (
                    <MarriageHistoryCard
                        key={record._id}
                        record={record}
                        onView={handleViewMarriageDetail}
                        onPreload={preloadRecord}
                        onTogglePublic={handleTogglePublic}
                        onCopyLink={handleCopyLink}
                        onTogglePin={handleTogglePin}
                        onOpenTagModal={setTagModalRecord}
                        onDelete={handleDelete}
                        onRate={handleRate}
                        renderStars={renderStars}
                    />
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
            {tagModalRecord && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                                <Tag size={18} className="text-indigo-600" />
                                Gắn Thư Mục / Tag Cho Lá Số
                            </h3>
                            <button type="button" onClick={() => setTagModalRecord(null)} className="text-slate-400 hover:text-slate-700">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Chọn một hoặc nhiều thư mục để phân loại lá số này (1 lá số thuộc nhiều thư mục):</p>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {userTags.map(t => {
                                const isChecked = (tagModalRecord.record.tags || ['Chung']).includes(t.name);
                                return (
                                    <label key={t._id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-indigo-50/50 transition-colors cursor-pointer">
                                        <span className="text-xs font-bold text-slate-700">{t.name}</span>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                const currentTags = tagModalRecord.record.tags || ['Chung'];
                                                const newTags = e.target.checked
                                                    ? [...new Set([...currentTags, t.name])]
                                                    : currentTags.filter(item => item !== t.name);
                                                setTagModalRecord({ ...tagModalRecord, record: { ...tagModalRecord.record, tags: newTags } });
                                            }}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                    </label>
                                );
                            })}
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Tạo thẻ mới (vd: Gia Đình, Khách Hàng...)"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreateNewTagInModal();
                                    }
                                }}
                                className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 font-bold"
                            />
                            <button
                                type="button"
                                onClick={handleCreateNewTagInModal}
                                disabled={!newTagName.trim() || actionLoading}
                                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                            >
                                <Plus size={13} />
                                <span>Thêm</span>
                            </button>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setTagModalRecord(null)}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSaveRecordTags(tagModalRecord.type, tagModalRecord.record._id, tagModalRecord.record.tags || ['Chung'])}
                                disabled={actionLoading}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                <span>Lưu Thay Đổi</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {toastMsg && <FloatingNotificationToast message={toastMsg} onClose={() => setToastMsg('')} />}
        </div>
    );
};

export default React.memo(HistoryBoard);

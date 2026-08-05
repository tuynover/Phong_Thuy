import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getUserTags, createTag, updateTag, deleteTag, getAllHistory, updateRecordTags } from '../services/api';
import { 
    Folder, FolderPlus, Edit2, Trash2, X, Search, Filter, Calendar, User, 
    Sparkles, Eye, Lock, Globe, ChevronLeft, ChevronRight, Plus, Check, Loader2, Tag, Clock
} from 'lucide-react';
import CustomSelect from './CustomSelect';

const LUNAR_HOURS_MAP = [
    "Tý (23h - 1h)", "Sửu (1h - 3h)", "Dần (3h - 5h)", "Mão (5h - 7h)", 
    "Thìn (7h - 9h)", "Tỵ (9h - 11h)", "Ngọ (11h - 13h)", "Mùi (13h - 15h)", 
    "Thân (15h - 17h)", "Dậu (17h - 19h)", "Tuất (19h - 21h)", "Hợi (21h - 23h)"
];

export default function MyFoldersModal({ isOpen, onClose, onViewHexagram, onViewBazi, onViewZiwei, onViewMarriage }) {
    const { user, setUser } = useContext(AuthContext);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState(null); // When null, viewing folder list; when tag object, viewing folder content
    
    // Tag management modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const [tagNameInput, setTagNameInput] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    // Records inside selected folder state
    const [recordsData, setRecordsData] = useState({ hexagrams: [], bazis: [], ziweis: [], marriages: [] });
    const [activeSubTab, setActiveSubTab] = useState('iching'); // 'iching' | 'bazi' | 'ziwei' | 'marriage'
    const [recordsLoading, setRecordsLoading] = useState(false);

    // Detailed Filter State inside folder
    const [searchQuery, setSearchQuery] = useState('');
    const [isPublicFilter, setIsPublicFilter] = useState('all'); // 'all' | 'true' | 'false'
    const [genderFilter, setGenderFilter] = useState('all'); // 'all' | '1' | '0'
    const [birthDayFilter, setBirthDayFilter] = useState('');
    const [birthMonthFilter, setBirthMonthFilter] = useState('');
    const [birthYearFilter, setBirthYearFilter] = useState('');
    const [birthHourFilter, setBirthHourFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            fetchTags();
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (selectedTag && user) {
            fetchFolderRecords();
        }
    }, [selectedTag, activeSubTab]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fetchTags = async () => {
        setLoading(true);
        try {
            const res = await getUserTags();
            setTags(res.data || []);
        } catch (err) {
            console.error("Lỗi tải danh sách thư mục:", err);
            showToast("Không thể tải danh sách thư mục.");
        } finally {
            setLoading(false);
        }
    };

    const fetchFolderRecords = async () => {
        if (!selectedTag) return;
        setRecordsLoading(true);
        try {
            const params = {
                tag: selectedTag.name,
                search: searchQuery,
                isPublic: isPublicFilter,
                gender: genderFilter,
                birthDay: birthDayFilter,
                birthMonth: birthMonthFilter,
                birthYear: birthYearFilter,
                birthHour: birthHourFilter,
                startDate: startDateFilter,
                endDate: endDateFilter
            };
            const res = await getAllHistory(user.id || user._id, params);
            setRecordsData(res.data || { hexagrams: [], bazis: [], ziweis: [], marriages: [] });
        } catch (err) {
            console.error("Lỗi tải lá số trong thư mục:", err);
            showToast("Không thể tải danh sách lá số trong thư mục.");
        } finally {
            setRecordsLoading(false);
        }
    };

    const handleCreateTag = async (e) => {
        e.preventDefault();
        if (!tagNameInput.trim()) return;
        setActionLoading(true);
        try {
            const res = await createTag(tagNameInput.trim());
            showToast(`Đã tạo thư mục "${res.data.name}" thành công.`);
            setTagNameInput('');
            setIsCreateModalOpen(false);
            fetchTags();
            // Cập nhật lại user context tags
            if (setUser) {
                setUser(prev => prev ? { ...prev, tags: [...(prev.tags || []), res.data] } : prev);
            }
        } catch (err) {
            showToast(err.response?.data?.error || "Không thể tạo thư mục mới.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateTag = async (e) => {
        e.preventDefault();
        if (!editingTag || !tagNameInput.trim()) return;
        setActionLoading(true);
        try {
            const res = await updateTag(editingTag._id, tagNameInput.trim());
            showToast(`Đã đổi tên thư mục thành "${res.data.name}".`);
            setTagNameInput('');
            setEditingTag(null);
            setIsEditModalOpen(false);
            if (selectedTag && selectedTag._id === editingTag._id) {
                setSelectedTag(res.data);
            }
            fetchTags();
        } catch (err) {
            showToast(err.response?.data?.error || "Không thể cập nhật tên thư mục.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTag = async (tagObj, e) => {
        e.stopPropagation();
        if (tagObj.isDefault) {
            showToast("Không thể xóa thư mục mặc định.");
            return;
        }
        if (!window.confirm(`Bạn có chắc chắn muốn xóa thư mục "${tagObj.name}"? Các lá số trong thư mục sẽ chuyển về thư mục "Chung".`)) {
            return;
        }
        setActionLoading(true);
        try {
            await deleteTag(tagObj._id);
            showToast(`Đã xóa thư mục "${tagObj.name}".`);
            if (selectedTag && selectedTag._id === tagObj._id) {
                setSelectedTag(null);
            }
            fetchTags();
        } catch (err) {
            showToast(err.response?.data?.error || "Không thể xóa thư mục.");
        } finally {
            setActionLoading(false);
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setIsPublicFilter('all');
        setGenderFilter('all');
        setBirthDayFilter('');
        setBirthMonthFilter('');
        setBirthYearFilter('');
        setBirthHourFilter('');
        setStartDateFilter('');
        setEndDateFilter('');
        fetchFolderRecords();
    };

    if (!isOpen) return null;

    const totalRecordsAllTags = tags.reduce((acc, t) => acc + (t.counts?.total || 0), 0);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-2.5 rounded-2xl shadow-xl z-50 text-xs font-bold flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
                {/* Modal Header */}
                <div className="p-4 sm:p-6 border-b border-slate-150 flex items-center justify-between bg-gradient-to-r from-amber-50/50 via-indigo-50/30 to-purple-50/50">
                    <div className="flex items-center gap-3">
                        {selectedTag ? (
                            <button 
                                onClick={() => setSelectedTag(null)} 
                                className="p-2 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs transition-colors flex items-center gap-1 text-xs font-bold"
                            >
                                <ChevronLeft size={16} />
                                <span>Thư mục</span>
                            </button>
                        ) : (
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                                <Folder size={20} />
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold font-serif text-slate-850">
                                {selectedTag ? `Thư mục: ${selectedTag.name}` : 'Lá Số Của Tôi'}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {selectedTag ? 'Quản lý và tra cứu các lá số/quẻ dịch thuộc thư mục này' : `Tổng số ${tags.length} thư mục và ${((user?.stats?.ichingCount || 0) + (user?.stats?.baziCount || 0) + (user?.stats?.ziweiCount || 0) + (user?.stats?.marriageCount || 0)) || totalRecordsAllTags} lá số`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!selectedTag && (
                            <button
                                onClick={() => { setTagNameInput(''); setIsCreateModalOpen(true); }}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <FolderPlus size={15} />
                                <span className="hidden sm:inline">Tạo Thư Mục</span>
                            </button>
                        )}
                        <button 
                            onClick={onClose} 
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                            <p className="text-xs text-slate-500 font-bold">Đang nạp danh sách thư mục...</p>
                        </div>
                    ) : !selectedTag ? (
                        /* VIEW 1: GRID ALL FOLDER TAGS */
                        <div className="space-y-6">
                            {/* Summary Banner */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex flex-col">
                                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Kinh Dịch</span>
                                    <span className="text-xl font-extrabold text-amber-900 mt-1">{(user?.stats?.ichingCount ?? 0) || tags.reduce((acc, t) => acc + (t.counts?.iching || 0), 0)} quẻ</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col">
                                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Bát Tự</span>
                                    <span className="text-xl font-extrabold text-blue-900 mt-1">{(user?.stats?.baziCount ?? 0) || tags.reduce((acc, t) => acc + (t.counts?.bazi || 0), 0)} lá</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col">
                                    <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Tử Vi</span>
                                    <span className="text-xl font-extrabold text-purple-900 mt-1">{(user?.stats?.ziweiCount ?? 0) || tags.reduce((acc, t) => acc + (t.counts?.ziwei || 0), 0)} lá</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex flex-col">
                                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Hôn Nhân</span>
                                    <span className="text-xl font-extrabold text-rose-900 mt-1">{(user?.stats?.marriageCount ?? 0) || tags.reduce((acc, t) => acc + (t.counts?.marriage || 0), 0)} lá</span>
                                </div>
                            </div>

                            {/* Folder Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {tags.map(tagObj => (
                                    <div
                                        key={tagObj._id}
                                        onClick={() => setSelectedTag(tagObj)}
                                        className="group p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                <Folder size={22} />
                                            </div>
                                            {!tagObj.isDefault && (
                                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingTag(tagObj);
                                                            setTagNameInput(tagObj.name);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                        title="Đổi tên thư mục"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDeleteTag(tagObj, e)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Xóa thư mục"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-extrabold text-slate-850 text-base group-hover:text-indigo-600 transition-colors truncate">
                                                    {tagObj.name}
                                                </h3>
                                                {tagObj.isDefault && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full">
                                                        Mặc định
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-semibold mt-1">
                                                {tagObj.counts?.total || 0} lá số / quẻ dịch
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                                            <span>KD: {tagObj.counts?.iching || 0} | BT: {tagObj.counts?.bazi || 0} | TV: {tagObj.counts?.ziwei || 0} | HN: {tagObj.counts?.marriage || 0}</span>
                                            <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* VIEW 2: CONTENTS INSIDE SELECTED FOLDER */
                        <div className="space-y-6">
                            {/* Subsystem Tabs */}
                            <div className="flex flex-wrap gap-2 border-b border-slate-150 pb-3">
                                <button
                                    onClick={() => setActiveSubTab('iching')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        activeSubTab === 'iching' ? 'bg-amber-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Kinh Dịch ({recordsData.hexagrams?.length || 0})
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('bazi')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        activeSubTab === 'bazi' ? 'bg-blue-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Bát Tự ({recordsData.bazis?.length || 0})
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('ziwei')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        activeSubTab === 'ziwei' ? 'bg-purple-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Tử Vi ({recordsData.ziweis?.length || 0})
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('marriage')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        activeSubTab === 'marriage' ? 'bg-rose-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Hôn Nhân ({recordsData.marriages?.length || 0})
                                </button>
                            </div>

                            {/* Detailed Filter Bar */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                                    <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                                        <Filter size={14} className="text-indigo-600" />
                                        Bộ Lọc Tìm Kiếm
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            disabled={!Boolean(searchQuery || (isPublicFilter && isPublicFilter !== 'all') || (genderFilter && genderFilter !== 'all') || birthDayFilter || birthMonthFilter || birthYearFilter || (birthHourFilter !== undefined && birthHourFilter !== '') || startDateFilter || endDateFilter)}
                                            className="text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white px-2.5 py-1 rounded-xl transition-all border border-red-100 bg-white shadow-2xs cursor-pointer"
                                        >
                                            Đặt lại
                                        </button>
                                        <button
                                            type="button"
                                            onClick={fetchFolderRecords}
                                            disabled={!Boolean(searchQuery || (isPublicFilter && isPublicFilter !== 'all') || (genderFilter && genderFilter !== 'all') || birthDayFilter || birthMonthFilter || birthYearFilter || (birthHourFilter !== undefined && birthHourFilter !== '') || startDateFilter || endDateFilter)}
                                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 text-white font-bold text-[11px] rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                        >
                                            <Search size={12} />
                                            <span>Tìm kiếm</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    {/* Search Box */}
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') fetchFolderRecords(); }}
                                            placeholder="Tìm tên / câu hỏi..."
                                            className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-2xl bg-white font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs shadow-2xs"
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
                                            onKeyDown={fetchFolderRecords}
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
                                            onKeyDown={fetchFolderRecords}
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
                                            onKeyDown={fetchFolderRecords}
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
                                            onKeyDown={fetchFolderRecords}
                                            options={Array.from({ length: 24 }, (_, i) => String(i))}
                                        />
                                    </div>

                                    {/* Creation Date From/To */}
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={startDateFilter}
                                            onChange={(e) => setStartDateFilter(e.target.value)}
                                            className="w-1/2 px-2.5 py-2 border border-slate-200 rounded-2xl bg-white text-[11px] font-semibold text-slate-700 shadow-2xs"
                                            title="Từ ngày lập"
                                        />
                                        <input
                                            type="date"
                                            value={endDateFilter}
                                            onChange={(e) => setEndDateFilter(e.target.value)}
                                            className="w-1/2 px-2.5 py-2 border border-slate-200 rounded-2xl bg-white text-[11px] font-semibold text-slate-700 shadow-2xs"
                                            title="Đến ngày lập"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Record List Output */}
                            {recordsLoading ? (
                                <div className="py-16 text-center">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-slate-500 font-bold">Đang lọc danh sách lá số...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeSubTab === 'iching' && (
                                        recordsData.hexagrams.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400 text-xs font-semibold">Không có quẻ dịch nào khớp bộ lọc.</div>
                                        ) : (
                                            recordsData.hexagrams.map(rec => (
                                                <div 
                                                    key={rec._id}
                                                    onClick={() => { onClose(); onViewHexagram(rec); }}
                                                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-extrabold text-slate-850 text-sm group-hover:text-amber-800">
                                                                {rec.question || 'Gieo Quẻ Kinh Dịch'}
                                                            </span>
                                                            <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                                                                🏷️ {(rec.tags && rec.tags.length > 0) ? rec.tags.join(', ') : 'Chung'}
                                                            </span>
                                                            {rec.isPublic && <Globe size={13} className="text-emerald-600" title="Đã chia sẻ" />}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {rec.primaryHexagram?.name} {rec.transformedHexagram ? `➞ ${rec.transformedHexagram.name}` : ''} | Ngày lập: {new Date(rec.dateCast || rec.createdAt).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold">Xem chi tiết</span>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}

                                    {activeSubTab === 'bazi' && (
                                        recordsData.bazis.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400 text-xs font-semibold">Không có lá số Bát Tự nào khớp bộ lọc.</div>
                                        ) : (
                                            recordsData.bazis.map(rec => (
                                                <div 
                                                    key={rec._id}
                                                    onClick={() => { onClose(); onViewBazi(rec); }}
                                                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-extrabold text-slate-850 text-sm group-hover:text-blue-800">
                                                                {(() => {
                                                                    const name = rec.inputInfo?.name?.trim();
                                                                    const hasCustomName = name && !name.startsWith('Bát Tự -') && !name.startsWith('Tử Vi -') && name.toLowerCase() !== 'bát tự' && name.toLowerCase() !== 'tử vi';
                                                                    const dateInfo = `${rec.inputInfo?.date || ''} ${rec.inputInfo?.time || ''} (${rec.inputInfo?.gender === 1 || rec.inputInfo?.gender === 'Nam' ? 'Nam' : 'Nữ'})`.trim();
                                                                    return hasCustomName ? `${name} : ${dateInfo}` : dateInfo;
                                                                })()}
                                                            </span>
                                                            <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-blue-50 text-blue-800 border border-blue-200/60">
                                                                🏷️ {(rec.tags && rec.tags.length > 0) ? rec.tags.join(', ') : 'Chung'}
                                                            </span>
                                                            {rec.isPublic && <Globe size={13} className="text-emerald-600" title="Đã chia sẻ" />}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Tiết khí: {rec.tietKhiTimeline}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[10px] font-extrabold">Xem chi tiết</span>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}

                                    {activeSubTab === 'ziwei' && (
                                        recordsData.ziweis.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400 text-xs font-semibold">Không có lá số Tử Vi nào khớp bộ lọc.</div>
                                        ) : (
                                            recordsData.ziweis.map(rec => (
                                                <div 
                                                    key={rec._id}
                                                    onClick={() => { onClose(); onViewZiwei(rec); }}
                                                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-extrabold text-slate-850 text-sm group-hover:text-purple-800">
                                                                {(() => {
                                                                    const name = rec.inputInfo?.name?.trim();
                                                                    const hasCustomName = name && !name.startsWith('Bát Tự -') && !name.startsWith('Tử Vi -') && name.toLowerCase() !== 'bát tự' && name.toLowerCase() !== 'tử vi';
                                                                    const dateInfo = `${rec.inputInfo?.date || ''} (${rec.inputInfo?.gender || ''} Mệnh)`.trim();
                                                                    return hasCustomName ? `${name} : ${dateInfo}` : dateInfo;
                                                                })()}
                                                            </span>
                                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700">
                                                                {rec.inputInfo?.gender}
                                                            </span>
                                                            <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-purple-50 text-purple-800 border border-purple-200/60">
                                                                🏷️ {(rec.tags && rec.tags.length > 0) ? rec.tags.join(', ') : 'Chung'}
                                                            </span>
                                                            {rec.isPublic && <Globe size={13} className="text-emerald-600" title="Đã chia sẻ" />}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Sinh ngày: {rec.inputInfo?.date} | Giờ: {LUNAR_HOURS_MAP[rec.inputInfo?.hour] || rec.inputInfo?.hour}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[10px] font-extrabold">Xem chi tiết</span>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}

                                    {activeSubTab === 'marriage' && (
                                        recordsData.marriages.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400 text-xs font-semibold">Không có kết quả Hôn Nhân nào khớp bộ lọc.</div>
                                        ) : (
                                            recordsData.marriages.map(rec => (
                                                <div 
                                                    key={rec._id}
                                                    onClick={() => { onClose(); onViewMarriage(rec); }}
                                                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-extrabold text-slate-850 text-sm group-hover:text-rose-800">
                                                                Hợp Hôn: {rec.inputInfo?.male?.name || 'Nam'} 🩵 & {rec.inputInfo?.female?.name || 'Nữ'} 🩷
                                                            </span>
                                                            <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-rose-50 text-rose-800 border border-rose-200/60">
                                                                🏷️ {(rec.tags && rec.tags.length > 0) ? rec.tags.join(', ') : 'Chung'}
                                                            </span>
                                                            {rec.isPublic && <Globe size={13} className="text-emerald-600" title="Đã chia sẻ" />}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Nam: {rec.inputInfo?.male?.date} | Nữ: {rec.inputInfo?.female?.date}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[10px] font-extrabold">Xem chi tiết</span>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tạo Tag Mới */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleCreateTag} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                                <FolderPlus size={18} className="text-indigo-600" />
                                Tạo Thư Mục Mới
                            </h3>
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={18} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={tagNameInput}
                            onChange={(e) => setTagNameInput(e.target.value)}
                            placeholder="Nhập tên thư mục (VD: Gia đình, Bạn bè)..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs"
                            >
                                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                <span>Lưu Thư Mục</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Sửa Tag */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleUpdateTag} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                                <Edit2 size={18} className="text-indigo-600" />
                                Đổi Tên Thư Mục
                            </h3>
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={18} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={tagNameInput}
                            onChange={(e) => setTagNameInput(e.target.value)}
                            placeholder="Nhập tên thư mục mới..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs"
                            >
                                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                <span>Cập Nhật</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

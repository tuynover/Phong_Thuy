import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getAdminCalculations,
  getAdminCalculationDetail,
  lockAdminCalculation,
  unlockAdminCalculation,
  deleteAdminCalculation
} from '@/services/api';
import {
  Search,
  Filter,
  X,
  Eye,
  Lock,
  Unlock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Info,
  BookOpen
} from 'lucide-react';

export default function AdminCalculationsTab({
  showAlert,
  showConfirm,
  onUserClick,
  onDirtyAnalytics,
  newIchingCount = 0,
  newBaziCount = 0,
  newZiweiCount = 0,
  newMarriageCount = 0,
  onClearBadge,
  refreshTrigger
}) {
  const [calcType, setCalcType] = useState('iching'); // 'iching' | 'bazi' | 'ziwei' | 'marriage'
  const [calcSearch, setCalcSearch] = useState('');
  const [calcStatusFilter, setCalcStatusFilter] = useState('');
  const [calcLimit] = useState(15);

  // Per-category calculation state
  const [ichingCalculations, setIchingCalculations] = useState([]);
  const [ichingTotal, setIchingTotal] = useState(0);
  const [ichingPage, setIchingPage] = useState(1);
  const [ichingCursors, setIchingCursors] = useState([null]);
  const [ichingLoading, setIchingLoading] = useState(false);

  const [baziCalculations, setBaziCalculations] = useState([]);
  const [baziTotal, setBaziTotal] = useState(0);
  const [baziPage, setBaziPage] = useState(1);
  const [baziCursors, setBaziCursors] = useState([null]);
  const [baziLoading, setBaziLoading] = useState(false);

  const [ziweiCalculations, setZiweiCalculations] = useState([]);
  const [ziweiTotal, setZiweiTotal] = useState(0);
  const [ziweiPage, setZiweiPage] = useState(1);
  const [ziweiCursors, setZiweiCursors] = useState([null]);
  const [ziweiLoading, setZiweiLoading] = useState(false);

  const [marriageCalculations, setMarriageCalculations] = useState([]);
  const [marriageTotal, setMarriageTotal] = useState(0);
  const [marriagePage, setMarriagePage] = useState(1);
  const [marriageCursors, setMarriageCursors] = useState([null]);
  const [marriageLoading, setMarriageLoading] = useState(false);

  // Detail Modal State
  const [selectedCalc, setSelectedCalc] = useState(null);
  const prefetchedCalcs = useRef({});

  // Active getters
  const activeCalcs =
    calcType === 'iching' ? ichingCalculations :
    calcType === 'bazi' ? baziCalculations :
    calcType === 'ziwei' ? ziweiCalculations :
    marriageCalculations;

  const activeCalcTotal =
    calcType === 'iching' ? ichingTotal :
    calcType === 'bazi' ? baziTotal :
    calcType === 'ziwei' ? ziweiTotal :
    marriageTotal;

  const activeCalcPage =
    calcType === 'iching' ? ichingPage :
    calcType === 'bazi' ? baziPage :
    calcType === 'ziwei' ? ziweiPage :
    marriagePage;

  const activeCalcsLoading =
    calcType === 'iching' ? ichingLoading :
    calcType === 'bazi' ? baziLoading :
    calcType === 'ziwei' ? ziweiLoading :
    marriageLoading;

  const activeSetCalcPage =
    calcType === 'iching' ? setIchingPage :
    calcType === 'bazi' ? setBaziPage :
    calcType === 'ziwei' ? setZiweiPage :
    setMarriagePage;

  const isFetchingRef = useRef({
    iching: false,
    bazi: false,
    ziwei: false,
    marriage: false
  });

  const fetchCalculationsData = useCallback(async (typeToFetch = undefined, overrideSearch = undefined, overrideStatus = undefined) => {
    const targetType = typeToFetch !== undefined ? typeToFetch : calcType;
    if (isFetchingRef.current[targetType]) return;
    isFetchingRef.current[targetType] = true;

    const setLoadingState =
      targetType === 'iching' ? setIchingLoading :
      targetType === 'bazi' ? setBaziLoading :
      targetType === 'ziwei' ? setZiweiLoading :
      setMarriageLoading;

    setLoadingState(true);
    try {
      const targetSearch = overrideSearch !== undefined ? overrideSearch : calcSearch;
      const targetStatus = overrideStatus !== undefined ? overrideStatus : calcStatusFilter;

      const isFilterReset = overrideSearch !== undefined || overrideStatus !== undefined;
      const targetPage = isFilterReset ? 1 : (
        targetType === 'iching' ? ichingPage :
        targetType === 'bazi' ? baziPage :
        targetType === 'ziwei' ? ziweiPage :
        marriagePage
      );
      const cursorsArr =
        targetType === 'iching' ? ichingCursors :
        targetType === 'bazi' ? baziCursors :
        targetType === 'ziwei' ? ziweiCursors :
        marriageCursors;
      const cursor = isFilterReset ? null : cursorsArr[targetPage - 1];

      const params = {
        limit: calcLimit,
        search: targetSearch,
        status: targetStatus,
        cursor
      };
      const res = await getAdminCalculations(targetType, params);
      const fetchedItems = res.data.items || [];

      if (targetType === 'iching') {
        setIchingCalculations(fetchedItems);
        setIchingTotal(res.data.total || 0);
        if (isFilterReset) {
          setIchingPage(1);
          setIchingCursors([null]);
        }
        if (fetchedItems.length === calcLimit) {
          const nextCursor = fetchedItems[fetchedItems.length - 1]._id;
          setIchingCursors(prev => { const n = [...prev]; n[targetPage] = nextCursor; return n; });
        }
      } else if (targetType === 'bazi') {
        setBaziCalculations(fetchedItems);
        setBaziTotal(res.data.total || 0);
        if (isFilterReset) {
          setBaziPage(1);
          setBaziCursors([null]);
        }
        if (fetchedItems.length === calcLimit) {
          const nextCursor = fetchedItems[fetchedItems.length - 1]._id;
          setBaziCursors(prev => { const n = [...prev]; n[targetPage] = nextCursor; return n; });
        }
      } else if (targetType === 'ziwei') {
        setZiweiCalculations(fetchedItems);
        setZiweiTotal(res.data.total || 0);
        if (isFilterReset) {
          setZiweiPage(1);
          setZiweiCursors([null]);
        }
        if (fetchedItems.length === calcLimit) {
          const nextCursor = fetchedItems[fetchedItems.length - 1]._id;
          setZiweiCursors(prev => { const n = [...prev]; n[targetPage] = nextCursor; return n; });
        }
      } else if (targetType === 'marriage') {
        setMarriageCalculations(fetchedItems);
        setMarriageTotal(res.data.total || 0);
        if (isFilterReset) {
          setMarriagePage(1);
          setMarriageCursors([null]);
        }
        if (fetchedItems.length === calcLimit) {
          const nextCursor = fetchedItems[fetchedItems.length - 1]._id;
          setMarriageCursors(prev => { const n = [...prev]; n[targetPage] = nextCursor; return n; });
        }
      }
    } catch (err) {
      console.error(`Lỗi tải danh sách quẻ/lá số (${targetType}):`, err);
    } finally {
      setLoadingState(false);
      isFetchingRef.current[targetType] = false;
    }
  }, [calcType, calcSearch, calcStatusFilter, calcLimit, ichingPage, baziPage, ziweiPage, marriagePage, ichingCursors, baziCursors, ziweiCursors, marriageCursors]);

  useEffect(() => {
    fetchCalculationsData(calcType);
    if (onClearBadge) onClearBadge(calcType);
  }, [calcType, activeCalcPage, refreshTrigger]);

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
        if (onDirtyAnalytics) onDirtyAnalytics();
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
        if (onDirtyAnalytics) onDirtyAnalytics();
        fetchCalculationsData(targetType);
      } catch (err) {
        showAlert(err.response?.data?.error || 'Lỗi khi xóa bản ghi.', 'error');
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* TAB CATEGORIES (Iching, Bazi, Ziwei, Marriage) */}
      <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 gap-1 w-full sm:w-96">
        {[
          { id: 'iching', name: 'Kinh Dịch', count: newIchingCount },
          { id: 'bazi', name: 'Bát Tự', count: newBaziCount },
          { id: 'ziwei', name: 'Tử Vi', count: newZiweiCount },
          { id: 'marriage', name: 'Hôn Nhân', count: newMarriageCount }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setCalcType(tab.id);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap text-center relative cursor-pointer ${calcType === tab.id ? 'bg-amber-800 text-white shadow-md' : 'text-slate-450 hover:text-slate-200'}`}
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
            placeholder={calcType === 'iching' ? 'Tìm theo userId hoặc Ý niệm...' : calcType === 'marriage' ? 'Tìm theo tên nam/nữ hoặc userId...' : 'Tìm theo userId...'}
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
              className="absolute right-3 top-2.5 text-slate-550 hover:text-slate-200 transition-colors cursor-pointer"
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
            className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-550 cursor-pointer"
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
              } else if (calcType === 'ziwei') {
                setZiweiPage(1);
                setZiweiCursors([null]);
              } else if (calcType === 'marriage') {
                setMarriagePage(1);
                setMarriageCursors([null]);
              }
              fetchCalculationsData(calcType, calcSearch, calcStatusFilter);
            }}
            className="bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
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
                    {calcType === 'iching' ? 'Ý niệm / Câu hỏi' : calcType === 'bazi' ? 'Giới Tính & Ngày Sinh' : calcType === 'marriage' ? 'Thông Tin Sinh Nam & Nữ' : 'Thông Tin Sinh'}
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
                          onClick={() => onUserClick && onUserClick(calc.userId)}
                          className="font-bold text-slate-200 hover:text-amber-500 text-left transition-colors hover:underline block cursor-pointer"
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
                      {calcType === 'ziwei' && (
                        <div className="text-slate-300">
                          Giới tính: <span className="font-bold text-slate-100">{calc.inputInfo?.gender || (calc.gender === 1 ? 'Nam' : 'Nữ')}</span><br />
                          <span className="text-[11px] text-slate-450">Sinh: {calc.inputInfo?.date || calc.date} ({calc.inputInfo?.hour !== undefined ? calc.inputInfo.hour : calc.hour} giờ)</span>
                        </div>
                      )}
                      {calcType === 'marriage' && (
                        <div className="text-slate-300 text-xs">
                          <span className="font-bold text-rose-400">Nam:</span> {calc.maleBaziData?.solarTimeline || `${calc.inputInfo?.male?.date || ''} ${calc.inputInfo?.male?.time || ''}`} <br />
                          <span className="font-bold text-pink-400">Nữ:</span> {calc.femaleBaziData?.solarTimeline || `${calc.inputInfo?.female?.date || ''} ${calc.inputInfo?.female?.time || ''}`}
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
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-550 border border-slate-800 rounded-lg transition-all cursor-pointer"
                          title="Xem chi tiết kết quả luận giải"
                        >
                          <Eye size={14} />
                        </button>
                        {!calc.isDeleted && (
                          <>
                            <button
                              onClick={() => handleLockCalculation(calc)}
                              className={`p-1.5 rounded-lg border border-slate-800 transition-all cursor-pointer ${calc.status === 'locked' ? 'hover:bg-emerald-955/60 text-emerald-500 hover:border-emerald-900/40' : 'hover:bg-amber-955/60 text-slate-400 hover:text-amber-500 hover:border-amber-900/40'}`}
                              title={calc.status === 'locked' ? 'Mở khóa bản ghi' : 'Khóa bản ghi'}
                            >
                              {calc.status === 'locked' ? <Unlock size={14} /> : <Lock size={14} />}
                            </button>
                            <button
                              onClick={() => handleDeleteCalculation(calc)}
                              className="p-1.5 hover:bg-red-955/60 text-slate-400 hover:text-red-555 border border-slate-800 hover:border-red-900/40 rounded-lg transition-all cursor-pointer"
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
                        onClick={() => onUserClick && onUserClick(calc.userId)}
                        className="font-bold text-slate-200 hover:text-amber-500 text-left transition-colors text-sm hover:underline block truncate font-serif cursor-pointer"
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
                  {calcType === 'ziwei' && (
                    <div className="space-y-0.5">
                      <div>Giới tính: <span className="font-bold text-slate-100">{calc.inputInfo?.gender || (calc.gender === 1 ? 'Nam' : 'Nữ')}</span></div>
                      <div className="text-[11px] text-slate-450 font-semibold">Sinh: {calc.inputInfo?.date || calc.date} ({calc.inputInfo?.hour !== undefined ? calc.inputInfo.hour : calc.hour} giờ)</div>
                    </div>
                  )}
                  {calcType === 'marriage' && (
                    <div className="space-y-0.5 text-[11px]">
                      <div><span className="font-bold text-rose-400">Nam</span>: {calc.maleBaziData?.solarTimeline || `${calc.inputInfo?.male?.date || ''} ${calc.inputInfo?.male?.time || ''}`}</div>
                      <div><span className="font-bold text-pink-400">Nữ</span>: {calc.femaleBaziData?.solarTimeline || `${calc.inputInfo?.female?.date || ''} ${calc.inputInfo?.female?.time || ''}`}</div>
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
                    className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                    title="Xem chi tiết"
                  >
                    <Eye size={12} /> Chi tiết
                  </button>
                  {!calc.isDeleted && (
                    <>
                      <button
                        onClick={() => handleLockCalculation(calc)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-[11px] font-semibold cursor-pointer ${calc.status === 'locked' ? 'hover:bg-emerald-955/60 text-emerald-500 border-emerald-900/40' : 'hover:bg-amber-955/60 text-amber-500 border-amber-900/40'}`}
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
                        className="flex items-center gap-1 px-2.5 py-1 hover:bg-red-950/60 text-red-500 border border-red-900/40 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
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
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-mono font-bold text-slate-300 px-2">Trang {activeCalcPage}</span>
              <button
                disabled={activeCalcPage * calcLimit >= activeCalcTotal || activeCalcsLoading}
                onClick={() => activeSetCalcPage(p => p + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 disabled:opacity-50 transition-colors cursor-pointer"
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={22} />
            </button>
            
            <h3 className="text-lg font-serif font-bold text-amber-500 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Info size={20} />
              Chi Tiết Bản Ghi Luận Giải {calcType === 'iching' ? 'Kinh Dịch' : calcType === 'bazi' ? 'Bát Tự' : calcType === 'ziwei' ? 'Tử Vi' : 'Hôn Nhân'}
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

              {/* Ziwei Details */}
              {calcType === 'ziwei' && selectedCalc.chartData && (
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

              {/* Marriage Details */}
              {calcType === 'marriage' && selectedCalc.inputInfo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                      <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Họ tên Nam:</span>
                      <strong className="text-slate-100">{selectedCalc.inputInfo.male?.name || 'N/A'}</strong>
                    </div>
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                      <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Họ tên Nữ:</span>
                      <strong className="text-slate-100">{selectedCalc.inputInfo.female?.name || 'N/A'}</strong>
                    </div>
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                      <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Sinh Nam:</span>
                      <strong className="text-slate-100">{selectedCalc.maleBaziData?.solarTimeline || `${selectedCalc.inputInfo.male?.date || ''} ${selectedCalc.inputInfo.male?.time || ''}`}</strong>
                    </div>
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                      <span className="text-slate-450 block text-[11px] uppercase tracking-wider">Sinh Nữ:</span>
                      <strong className="text-slate-100">{selectedCalc.femaleBaziData?.solarTimeline || `${selectedCalc.inputInfo.female?.date || ''} ${selectedCalc.inputInfo.female?.time || ''}`}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Interpretation Content Display */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-amber-400 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={16} /> Nội Dung Luận Giải AI (Dịch Bản / Lá Số):
                </span>
                {selectedCalc.aiInterpretation?.content ? (
                  <div className="text-slate-300 text-xs sm:text-sm leading-relaxed max-h-[350px] overflow-y-auto pr-2 prose prose-invert max-w-none border-t border-slate-850 pt-3">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedCalc.aiInterpretation.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span className="text-slate-500 italic block text-xs">
                    Bản ghi này chưa có nội dung luận giải AI (hoặc chưa tạo dịch bản).
                  </span>
                )}
              </div>

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
  );
}

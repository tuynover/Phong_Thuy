import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getIChingHistory, getBaziHistory, getZiweiHistory, getMarriageHistory, rateIChing, rateBazi, rateZiwei, rateMarriage, deleteCalculation, getIChingRecord, getBaziRecord, getZiweiRecord, getMarriageRecord } from '../services/api';
import { Star, Clock, Calendar, Trash2, X, Info, Check, AlertTriangle, Loader2 } from 'lucide-react';

const LUNAR_HOURS_MAP = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"
];

const HistoryBoard = ({ onViewHexagram, onViewBazi, onViewZiwei, onViewMarriage, preloadedData, onCacheInvalidate, active, onSaveCache }) => {
    const { user } = useContext(AuthContext);
    const [hexagrams, setHexagrams] = useState([]);
    const [bazis, setBazis] = useState([]);
    const [ziweis, setZiweis] = useState([]);
    const [marriages, setMarriages] = useState([]);
    const [loading, setLoading] = useState(() => {
        if (preloadedData && preloadedData.hexagrams) {
            return false;
        }
        return true;
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('iching'); // 'iching' | 'bazi' | 'ziwei' | 'marriage'
    const [dialog, setDialog] = useState(null); // { type: 'confirm' | 'success' | 'error', message: '', onConfirm: null }
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
    }, [user, preloadedData, active]);

    // Clear detail cache when user changes (logout/switch accounts)
    useEffect(() => {
        prefetchedDetails.current = {};
    }, [user]);

    const initData = async () => {
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
            const userId = user.id || user._id;
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

    const fetchData = async () => {
        setLoading(true);
        try {
            const userId = user.id || user._id;
            const [hexRes, baziRes, ziweiRes, marriageRes] = await Promise.all([
                getIChingHistory(userId),
                getBaziHistory(userId),
                getZiweiHistory(userId),
                getMarriageHistory(userId)
            ]);
            setHexagrams(hexRes.data);
            setBazis(baziRes.data);
            setZiweis(ziweiRes.data);
            setMarriages(marriageRes.data);
            if (onSaveCache) {
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

            <div className="space-y-4">
                {activeTab === 'iching' && hexagrams.length === 0 && <p className="text-center text-gray-500">Chưa có quẻ nào được gieo.</p>}
                {activeTab === 'iching' && paginatedList.map((record) => (
                    <div 
                        key={record._id} 
                        onClick={() => handleViewHexagramDetail(record)} 
                        onMouseEnter={() => preloadRecord('iching', record._id)}
                        onTouchStart={() => preloadRecord('iching', record._id)}
                        className="border border-amber-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-amber-50/20 cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg text-amber-900">{record.primaryHexagram.name} {record.transformedHexagram?.name ? `-> ${record.transformedHexagram.name}` : ''}</h3>
                                <p className="text-sm text-gray-600 italic">Hỏi: {record.question}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Clock size={12}/> {new Date(record.dateCast).toLocaleString('vi-VN')}</p>
                            </div>
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => handleViewHexagramDetail(record)} className="text-amber-600 hover:underline text-sm font-medium">Xem chi tiết</button>
                                <button 
                                    onClick={() => handleDelete('iching', record._id)} 
                                    className="text-red-500 hover:text-red-750 transition-colors p-1"
                                    title="Xóa vĩnh viễn"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Rating Section */}
                        <div onClick={(e) => e.stopPropagation()} className="mt-4 pt-4 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-default">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Độ chính xác:</span>
                                {renderStars(record.rating, (rating) => handleRate('iching', record._id, rating, document.getElementById(`feedback-hex-${record._id}`)?.value || record.feedback))}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input 
                                    type="text" 
                                    id={`feedback-hex-${record._id}`}
                                    placeholder="Ghi chú ứng kỳ..." 
                                    className="flex-1 text-sm px-3 py-1 border border-gray-200 rounded focus:border-amber-400 focus:outline-none"
                                    defaultValue={record.feedback}
                                  />
                                  <button 
                                      onClick={() => {
                                          const val = document.getElementById(`feedback-hex-${record._id}`).value;
                                          if (val !== record.feedback || !record.rating) {
                                              handleRate('iching', record._id, record.rating, val);
                                          }
                                      }}
                                      className="px-4 py-1 bg-amber-600 text-white text-sm font-medium rounded shadow hover:bg-amber-700 transition-colors"
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
                          className="border border-blue-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-blue-50/20 cursor-pointer"
                      >
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                  <h3 className="font-bold text-lg text-blue-900">Lá số Bát Tự: {record.inputInfo.date} {record.inputInfo.time} ({record.inputInfo.gender === 1 ? 'Nam' : 'Nữ'})</h3>
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Calendar size={12}/> Tiết khí: {record.tietKhiTimeline}</p>
                              </div>
                              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => handleViewBaziDetail(record)} className="text-blue-600 hover:underline text-sm font-medium">Xem chi tiết</button>
                                  <button 
                                      onClick={() => handleDelete('bazi', record._id)} 
                                      className="text-red-500 hover:text-red-755 transition-colors p-1"
                                      title="Xóa vĩnh viễn"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </div>
                          
                          {/* Rating Section */}
                          <div onClick={(e) => e.stopPropagation()} className="mt-4 pt-4 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-default">
                              <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-700">Đánh giá:</span>
                                  {renderStars(record.rating, (rating) => handleRate('bazi', record._id, rating, document.getElementById(`feedback-bazi-${record._id}`)?.value || record.feedback))}
                              </div>
                              <div className="flex-1 flex gap-2">
                                  <input 
                                      type="text" 
                                      id={`feedback-bazi-${record._id}`}
                                      placeholder="Nhận xét..." 
                                      className="flex-1 text-sm px-3 py-1 border border-gray-200 rounded focus:border-blue-400 focus:outline-none"
                                      defaultValue={record.feedback}
                                  />
                                  <button 
                                      onClick={() => {
                                          const val = document.getElementById(`feedback-bazi-${record._id}`).value;
                                          if (val !== record.feedback || !record.rating) {
                                              handleRate('bazi', record._id, record.rating, val);
                                          }
                                      }}
                                      className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded shadow hover:bg-blue-700 transition-colors"
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
                          className="border border-purple-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-purple-50/20 cursor-pointer"
                      >
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                  <h3 className="font-bold text-lg text-purple-900">Lá số Tử Vi: {record.inputInfo?.date || ''} ({record.inputInfo?.gender || ''} Mệnh)</h3>
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                      <Clock size={12}/> Giờ sinh: {record.inputInfo?.hour !== undefined ? LUNAR_HOURS_MAP[record.inputInfo.hour] : ''}
                                  </p>
                              </div>
                              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => onViewZiwei(record)} className="text-purple-600 hover:underline text-sm font-medium">Xem chi tiết</button>
                                  <button 
                                      onClick={() => handleDelete('ziwei', record._id)} 
                                      className="text-red-500 hover:text-red-755 transition-colors p-1"
                                      title="Xóa vĩnh viễn"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </div>
                          
                          {/* Rating Section */}
                          <div onClick={(e) => e.stopPropagation()} className="mt-4 pt-4 border-t border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-default">
                              <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-700">Đánh giá:</span>
                                  {renderStars(record.rating, (rating) => handleRate('ziwei', record._id, rating, document.getElementById(`feedback-ziwei-${record._id}`)?.value || record.feedback))}
                              </div>
                              <div className="flex-1 flex gap-2">
                                  <input 
                                      type="text" 
                                      id={`feedback-ziwei-${record._id}`}
                                      placeholder="Nhận xét..." 
                                      className="flex-1 text-sm px-3 py-1 border border-gray-200 rounded focus:border-purple-400 focus:outline-none"
                                      defaultValue={record.feedback}
                                  />
                                  <button 
                                      onClick={() => {
                                          const val = document.getElementById(`feedback-ziwei-${record._id}`).value;
                                          if (val !== record.feedback || !record.rating) {
                                              handleRate('ziwei', record._id, record.rating, val);
                                          }
                                      }}
                                      className="px-4 py-1 bg-purple-600 text-white text-sm font-medium rounded shadow hover:bg-purple-700 transition-colors"
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
                          className="border border-rose-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-rose-50/20 cursor-pointer"
                      >
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                  <h3 className="font-bold text-lg text-rose-900">Hợp Hôn: Nam ({record.inputInfo?.male?.date || ''}) & Nữ ({record.inputInfo?.female?.date || ''})</h3>
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Clock size={12}/> {new Date(record.createdAt).toLocaleString('vi-VN')}</p>
                              </div>
                              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => handleViewMarriageDetail(record)} className="text-rose-600 hover:underline text-sm font-medium">Xem chi tiết</button>
                                  <button 
                                      onClick={() => handleDelete('marriage', record._id)} 
                                      className="text-red-500 hover:text-red-755 transition-colors p-1"
                                      title="Xóa vĩnh viễn"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </div>
                          
                          {/* Rating Section */}
                          <div onClick={(e) => e.stopPropagation()} className="mt-4 pt-4 border-t border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-default">
                              <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-700">Đánh giá:</span>
                                  {renderStars(record.rating, (rating) => handleRate('marriage', record._id, rating, document.getElementById(`feedback-marr-${record._id}`)?.value || record.feedback))}
                              </div>
                              <div className="flex-1 flex gap-2">
                                  <input 
                                      type="text" 
                                      id={`feedback-marr-${record._id}`}
                                      placeholder="Nhận xét..." 
                                      className="flex-1 text-sm px-3 py-1 border border-gray-200 rounded focus:border-rose-450 focus:outline-none"
                                      defaultValue={record.feedback}
                                  />
                                  <button 
                                      onClick={() => {
                                          const val = document.getElementById(`feedback-marr-${record._id}`).value;
                                          if (val !== record.feedback || !record.rating) {
                                              handleRate('marriage', record._id, record.rating, val);
                                          }
                                      }}
                                      className="px-4 py-1 bg-rose-600 text-white text-sm font-medium rounded shadow hover:bg-rose-700 transition-colors"
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
        </div>
    );
};

export default HistoryBoard;

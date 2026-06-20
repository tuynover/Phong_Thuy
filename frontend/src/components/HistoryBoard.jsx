import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getHexagramHistory, getBaziHistory, getTuViHistory, rateHexagram, rateBazi, rateTuVi, deleteCalculation } from '../services/api';
import { Star, Clock, Calendar, Trash2, X, Info, Check, AlertTriangle } from 'lucide-react';

const LUNAR_HOURS_MAP = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"
];

const HistoryBoard = ({ onViewHexagram, onViewBazi, onViewTuVi }) => {
    const { user } = useContext(AuthContext);
    const [hexagrams, setHexagrams] = useState([]);
    const [bazis, setBazis] = useState([]);
    const [tuvis, setTuvis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('hexagram'); // 'hexagram' | 'bazi' | 'tu_vi'
    const [dialog, setDialog] = useState(null); // { type: 'confirm' | 'success' | 'error', message: '', onConfirm: null }

    const activeTheme = activeTab === 'hexagram' 
        ? { text: 'text-amber-800', bg: 'bg-amber-800 hover:bg-amber-900', border: 'border-amber-100', textAccent: 'text-amber-600' }
        : activeTab === 'bazi'
            ? { text: 'text-blue-800', bg: 'bg-blue-800 hover:bg-blue-900', border: 'border-blue-100', textAccent: 'text-blue-600' }
            : { text: 'text-purple-800', bg: 'bg-purple-800 hover:bg-purple-900', border: 'border-purple-100', textAccent: 'text-purple-600' };

    const showConfirm = (message, onConfirm) => {
        setDialog({ type: 'confirm', message, onConfirm });
    };

    const showAlert = (message, type = 'success') => {
        setDialog({ type, message });
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const userId = user.id || user._id;
            const [hexRes, baziRes, tuviRes] = await Promise.all([
                getHexagramHistory(userId),
                getBaziHistory(userId),
                getTuViHistory(userId)
            ]);
            setHexagrams(hexRes.data);
            setBazis(baziRes.data);
            setTuvis(tuviRes.data);
        } catch (error) {
            console.error("Error fetching history", error);
        }
        setLoading(false);
    };

    const handleRate = async (type, id, rating, feedback) => {
        try {
            if (type === 'hexagram') {
                await rateHexagram(id, rating, feedback);
                setHexagrams(hexagrams.map(h => h._id === id ? { ...h, rating, feedback } : h));
            } else if (type === 'bazi') {
                await rateBazi(id, rating, feedback);
                setBazis(bazis.map(b => b._id === id ? { ...b, rating, feedback } : b));
            } else {
                await rateTuVi(id, rating, feedback);
                setTuvis(tuvis.map(t => t._id === id ? { ...t, rating, feedback } : t));
            }
        } catch (err) {
            console.error("Lỗi khi lưu đánh giá.", err);
        }
    };

    const handleDelete = async (type, id) => {
        showConfirm("Bạn có chắc chắn muốn xóa vĩnh viễn bản ghi này khỏi lịch sử không?", async () => {
            try {
                await deleteCalculation(type, id);
                if (type === 'hexagrams') {
                    setHexagrams(hexagrams.filter(h => h._id !== id));
                } else if (type === 'bazi') {
                    setBazis(bazis.filter(b => b._id !== id));
                } else {
                    setTuvis(tuvis.filter(t => t._id !== id));
                }
                showAlert("Xóa bản ghi lịch sử thành công.", "success");
            } catch (err) {
                console.error("Lỗi khi xóa bản ghi lịch sử:", err);
                showAlert("Không thể xóa bản ghi này. Vui lòng thử lại sau.", "error");
            }
        });
    };

    if (!user) return <div className="text-center p-10">Vui lòng đăng nhập để xem lịch sử.</div>;
    if (loading) return <div className="text-center p-10">Đang tải lịch sử...</div>;

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
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-950 mb-6 md:mb-8 text-center border-b pb-4">Lịch Sử Của Bạn</h2>
            
            <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 md:gap-4 mb-6 md:mb-8">
                <button 
                    onClick={() => setActiveTab('hexagram')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs md:text-base rounded-full font-bold transition-all ${activeTab === 'hexagram' ? 'bg-amber-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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
                    onClick={() => setActiveTab('tu_vi')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs md:text-base rounded-full font-bold transition-all ${activeTab === 'tu_vi' ? 'bg-purple-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Tử Vi ({tuvis.length})
                </button>
            </div>

            <div className="space-y-4">
                {activeTab === 'hexagram' && hexagrams.length === 0 && <p className="text-center text-gray-500">Chưa có quẻ nào được gieo.</p>}
                {activeTab === 'hexagram' && hexagrams.map((record) => (
                    <div key={record._id} onClick={() => onViewHexagram(record)} className="border border-amber-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-amber-50/20 cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg text-amber-900">{record.primaryHexagram.name} {record.transformedHexagram?.name ? `-> ${record.transformedHexagram.name}` : ''}</h3>
                                <p className="text-sm text-gray-600 italic">Hỏi: {record.question}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Clock size={12}/> {new Date(record.dateCast).toLocaleString('vi-VN')}</p>
                            </div>
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => onViewHexagram(record)} className="text-amber-600 hover:underline text-sm font-medium">Xem chi tiết</button>
                                <button 
                                    onClick={() => handleDelete('hexagrams', record._id)} 
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
                                {renderStars(record.rating, (rating) => handleRate('hexagram', record._id, rating, document.getElementById(`feedback-hex-${record._id}`)?.value || record.feedback))}
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
                                            handleRate('hexagram', record._id, record.rating, val);
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
                {activeTab === 'bazi' && bazis.map((record) => (
                    <div key={record._id} onClick={() => onViewBazi(record)} className="border border-blue-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-blue-50/20 cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg text-blue-900">Lá số Bát Tự: {record.inputInfo.date} {record.inputInfo.time} ({record.inputInfo.gender === 1 ? 'Nam' : 'Nữ'})</h3>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Calendar size={12}/> Tiết khí: {record.tietKhiTimeline}</p>
                            </div>
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => onViewBazi(record)} className="text-blue-600 hover:underline text-sm font-medium">Xem chi tiết</button>
                                <button 
                                    onClick={() => handleDelete('bazi', record._id)} 
                                    className="text-red-500 hover:text-red-700 transition-colors p-1"
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

                {activeTab === 'tu_vi' && tuvis.length === 0 && <p className="text-center text-gray-500">Chưa có lá số Tử Vi nào được lập.</p>}
                {activeTab === 'tu_vi' && tuvis.map((record) => (
                    <div key={record._id} onClick={() => onViewTuVi(record)} className="border border-purple-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-purple-50/20 cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg text-purple-900">Lá số Tử Vi: {record.inputInfo?.date || ''} ({record.inputInfo?.gender || ''} Mệnh)</h3>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <Clock size={12}/> Giờ sinh: {record.inputInfo?.hour !== undefined ? LUNAR_HOURS_MAP[record.inputInfo.hour] : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => onViewTuVi(record)} className="text-purple-600 hover:underline text-sm font-medium">Xem chi tiết</button>
                                <button 
                                    onClick={() => handleDelete('tu-vi', record._id)} 
                                    className="text-red-500 hover:text-red-700 transition-colors p-1"
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
                                {renderStars(record.rating, (rating) => handleRate('tu_vi', record._id, rating, document.getElementById(`feedback-tu-vi-${record._id}`)?.value || record.feedback))}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input 
                                    type="text" 
                                    id={`feedback-tu-vi-${record._id}`}
                                    placeholder="Nhận xét..." 
                                    className="flex-1 text-sm px-3 py-1 border border-gray-200 rounded focus:border-purple-400 focus:outline-none"
                                    defaultValue={record.feedback}
                                />
                                <button 
                                    onClick={() => {
                                        const val = document.getElementById(`feedback-tu-vi-${record._id}`).value;
                                        if (val !== record.feedback || !record.rating) {
                                            handleRate('tu_vi', record._id, record.rating, val);
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
            </div>

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

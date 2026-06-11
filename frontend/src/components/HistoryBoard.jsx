import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getHexagramHistory, getBaziHistory, getTuViHistory, rateHexagram, rateBazi, rateTuVi } from '../services/api';
import { Star, Clock, Calendar } from 'lucide-react';

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
                            <button className="text-amber-600 hover:underline text-sm font-medium">Xem chi tiết</button>
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
                            <button className="text-blue-600 hover:underline text-sm font-medium">Xem chi tiết</button>
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
                            <button className="text-purple-600 hover:underline text-sm font-medium">Xem chi tiết</button>
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
        </div>
    );
};

export default HistoryBoard;

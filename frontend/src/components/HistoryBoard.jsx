import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getHexagramHistory, getBaziHistory, rateHexagram, rateBazi } from '../services/api';
import { Star, Clock, Calendar } from 'lucide-react';

const HistoryBoard = ({ onViewHexagram, onViewBazi }) => {
    const { user } = useContext(AuthContext);
    const [hexagrams, setHexagrams] = useState([]);
    const [bazis, setBazis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('hexagram'); // 'hexagram' | 'bazi'

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const userId = user.id || user._id;
            const [hexRes, baziRes] = await Promise.all([
                getHexagramHistory(userId),
                getBaziHistory(userId)
            ]);
            setHexagrams(hexRes.data);
            setBazis(baziRes.data);
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
            } else {
                await rateBazi(id, rating, feedback);
                setBazis(bazis.map(b => b._id === id ? { ...b, rating, feedback } : b));
            }
            alert("Đã lưu đánh giá thành công!");
        } catch (err) {
            alert("Lỗi khi lưu đánh giá.");
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
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-amber-950 mb-8 text-center border-b pb-4">Lịch Sử Của Bạn</h2>
            
            <div className="flex justify-center gap-4 mb-8">
                <button 
                    onClick={() => setActiveTab('hexagram')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'hexagram' ? 'bg-amber-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Kinh Dịch ({hexagrams.length})
                </button>
                <button 
                    onClick={() => setActiveTab('bazi')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'bazi' ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Bát Tự ({bazis.length})
                </button>
            </div>

            <div className="space-y-4">
                {activeTab === 'hexagram' && hexagrams.length === 0 && <p className="text-center text-gray-500">Chưa có quẻ nào được gieo.</p>}
                {activeTab === 'hexagram' && hexagrams.map((record) => (
                    <div key={record._id} className="border border-amber-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-amber-50/20">
                        <div className="flex justify-between items-start mb-2">
                            <div className="cursor-pointer" onClick={() => onViewHexagram(record)}>
                                <h3 className="font-bold text-lg text-amber-900">{record.primaryHexagram.name} {record.transformedHexagram?.name ? `-> ${record.transformedHexagram.name}` : ''}</h3>
                                <p className="text-sm text-gray-600 italic">Hỏi: {record.question}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Clock size={12}/> {new Date(record.dateCast).toLocaleString('vi-VN')}</p>
                            </div>
                            <button onClick={() => onViewHexagram(record)} className="text-amber-600 hover:underline text-sm font-medium">Xem chi tiết</button>
                        </div>
                        
                        {/* Rating Section */}
                        <div className="mt-4 pt-4 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Độ chính xác:</span>
                                {renderStars(record.rating, (rating) => handleRate('hexagram', record._id, rating, record.feedback))}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Ghi chú ứng kỳ..." 
                                    className="flex-1 text-sm px-3 py-1 border border-gray-200 rounded focus:border-amber-400 focus:outline-none"
                                    defaultValue={record.feedback}
                                    onBlur={(e) => {
                                        if (e.target.value !== record.feedback) {
                                            handleRate('hexagram', record._id, record.rating, e.target.value);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {activeTab === 'bazi' && bazis.length === 0 && <p className="text-center text-gray-500">Chưa có lá số nào được lập.</p>}
                {activeTab === 'bazi' && bazis.map((record) => (
                    <div key={record._id} className="border border-blue-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-blue-50/20">
                        <div className="flex justify-between items-start mb-2">
                            <div className="cursor-pointer" onClick={() => onViewBazi(record)}>
                                <h3 className="font-bold text-lg text-blue-900">Lá số: {record.inputInfo.date} {record.inputInfo.time} ({record.inputInfo.gender === 1 ? 'Nam' : 'Nữ'})</h3>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Calendar size={12}/> Tiết khí: {record.tietKhiTimeline}</p>
                            </div>
                            <button onClick={() => onViewBazi(record)} className="text-blue-600 hover:underline text-sm font-medium">Xem chi tiết</button>
                        </div>
                        
                        {/* Rating Section */}
                        <div className="mt-4 pt-4 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Đánh giá:</span>
                                {renderStars(record.rating, (rating) => handleRate('bazi', record._id, rating, record.feedback))}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Nhận xét..." 
                                    className="flex-1 text-sm px-3 py-1 border border-gray-200 rounded focus:border-blue-400 focus:outline-none"
                                    defaultValue={record.feedback}
                                    onBlur={(e) => {
                                        if (e.target.value !== record.feedback) {
                                            handleRate('bazi', record._id, record.rating, e.target.value);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryBoard;

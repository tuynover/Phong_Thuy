import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateBaziInfo } from '../services/api';
import { X } from 'lucide-react';

export default function UpdateBaziModal({ isOpen, onClose, onSuccess }) {
  const { user, setUser } = useContext(AuthContext); // Need to add setUser in AuthContext if not there, or we can just fetch user
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await updateBaziInfo(user.id || user._id, day, month, year, hour, minute);
      
      // Update local storage and context
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      
      setLoading(false);
      onSuccess(res.data.user);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-2 text-blue-950">
          Thông tin Bát Tự
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">Bạn chưa nhập thông tin ngày giờ sinh. Vui lòng bổ sung để xem lá số.</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày/Tháng/Năm Sinh (Dương lịch)</label>
              <div className="flex gap-2">
                  <input type="number" min="1" max="31" placeholder="Ngày" required value={day} onChange={(e) => setDay(e.target.value)} className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="number" min="1" max="12" placeholder="Tháng" required value={month} onChange={(e) => setMonth(e.target.value)} className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="number" min="1900" max="2100" placeholder="Năm" required value={year} onChange={(e) => setYear(e.target.value)} className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giờ sinh (0-23) : Phút (0-59)</label>
              <div className="flex gap-2">
                  <input type="number" min="0" max="23" placeholder="Giờ" required value={hour} onChange={(e) => setHour(e.target.value)} className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="number" min="0" max="59" placeholder="Phút" required value={minute} onChange={(e) => setMinute(e.target.value)} className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </form>
      </div>
    </div>
  );
}

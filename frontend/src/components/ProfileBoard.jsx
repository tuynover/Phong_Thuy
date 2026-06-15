import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import { User, Phone, Mail, Calendar, Clock, Sparkles } from 'lucide-react';

export default function ProfileBoard() {
  const { user, setUser } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender !== undefined ? user.gender : 1);
  const [day, setDay] = useState(user?.baziInfo?.day || '');
  const [month, setMonth] = useState(user?.baziInfo?.month || '');
  const [year, setYear] = useState(user?.baziInfo?.year || '');
  const [hour, setHour] = useState(user?.baziInfo?.hour !== undefined ? user.baziInfo.hour : '');
  const [minute, setMinute] = useState(user?.baziInfo?.minute !== undefined ? user.baziInfo.minute : '');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Update local state when user context changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setGender(user.gender !== undefined ? user.gender : 1);
      setDay(user.baziInfo?.day || '');
      setMonth(user.baziInfo?.month || '');
      setYear(user.baziInfo?.year || '');
      setHour(user.baziInfo?.hour !== undefined ? user.baziInfo.hour : '');
      setMinute(user.baziInfo?.minute !== undefined ? user.baziInfo.minute : '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate baziInfo partially or fully
    let baziData = {};
    if (day || month || year || hour !== '' || minute !== '') {
      // If any Bazi field is filled, require them all (or clean them up)
      if (!day || !month || !year || hour === '' || minute === '') {
        setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin ngày, tháng, năm, giờ và phút sinh của Bát Tự.' });
        setLoading(false);
        return;
      }
      baziData = {
        day: parseInt(day),
        month: parseInt(month),
        year: parseInt(year),
        hour: parseInt(hour),
        minute: parseInt(minute)
      };
    } else {
      // If everything is blank, we can send null to clear it
      baziData = {
        day: null,
        month: null,
        year: null,
        hour: null,
        minute: null
      };
    }

    try {
      const payload = {
        userId: user.id || user._id,
        name,
        phone,
        gender: parseInt(gender),
        ...baziData
      };
      
      const res = await updateProfile(payload);
      
      // Update local storage and context
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      
      setMessage({ type: 'success', text: 'Cập nhật thông tin tài khoản thành công!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể lưu thông tin. Vui lòng thử lại.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto my-6 p-4 sm:p-8 bg-white border border-gray-150 rounded-3xl shadow-xl animate-in fade-in duration-300">
      
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-amber-50 rounded-full border border-amber-250 mb-3">
          <User className="text-amber-800" size={32} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-950">Thông Tin Cá Nhân</h2>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin tài khoản và ngày sinh học thuật của bạn</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium border text-center ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Email - Disabled */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Mail size={15} className="text-gray-400" />
            Địa chỉ Email
          </label>
          <input 
            type="email" 
            value={user?.email || ''} 
            disabled 
            className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed focus:outline-none"
            title="Email đăng ký làm tài khoản không thể chỉnh sửa"
          />
          <p className="text-xs text-gray-400 mt-1">Email đăng ký làm tài khoản không thể thay đổi.</p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <User size={15} className="text-gray-400" />
            Họ và Tên
          </label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required
            className="w-full px-4 py-2.5 bg-amber-50/10 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            placeholder="Nhập họ và tên..."
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Phone size={15} className="text-gray-400" />
            Số Điện Thoại
          </label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className="w-full px-4 py-2.5 bg-amber-50/10 border border-gray-300 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            placeholder="Nhập số điện thoại..."
          />
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={15} className="text-gray-400" />
            Giới tính
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 flex-1 justify-center transition-colors">
              <input 
                type="radio" 
                name="gender" 
                value={1} 
                checked={gender === 1}
                onChange={() => setGender(1)}
                className="text-amber-800 focus:ring-amber-500"
              />
              <span className="font-semibold text-gray-700 text-sm">Nam</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 flex-1 justify-center transition-colors">
              <input 
                type="radio" 
                name="gender" 
                value={0} 
                checked={gender === 0}
                onChange={() => setGender(0)}
                className="text-amber-800 focus:ring-amber-500"
              />
              <span className="font-semibold text-gray-700 text-sm">Nữ</span>
            </label>
          </div>
        </div>

        {/* Bazi / Birth Information */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-widest mb-4">Thông tin lá số Bát Tự / Tử Vi</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Solar Date */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                Ngày sinh Dương Lịch
              </label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="1" 
                  max="31" 
                  placeholder="Ngày" 
                  value={day} 
                  onChange={(e) => setDay(e.target.value)} 
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <input 
                  type="number" 
                  min="1" 
                  max="12" 
                  placeholder="Tháng" 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)} 
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <input 
                  type="number" 
                  min="1900" 
                  max="2100" 
                  placeholder="Năm" 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)} 
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Solar Time */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-gray-400" />
                Giờ & Phút sinh
              </label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="0" 
                  max="23" 
                  placeholder="Giờ" 
                  value={hour} 
                  onChange={(e) => setHour(e.target.value)} 
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <input 
                  type="number" 
                  min="0" 
                  max="59" 
                  placeholder="Phút" 
                  value={minute} 
                  onChange={(e) => setMinute(e.target.value)} 
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Dùng để tự động tính toán lá số Bát Tự và Tử Vi cho tài khoản của bạn.</p>
        </div>

        {/* Submit Button */}
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Đang lưu...</span>
            </>
          ) : (
            <span>Lưu Thông Tin</span>
          )}
        </button>

      </form>
    </div>
  );
}

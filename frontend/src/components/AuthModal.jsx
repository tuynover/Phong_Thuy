import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const { login, register } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [gender, setGender] = useState(1);
  const [useBazi, setUseBazi] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let res;
    if (isLogin) {
      res = await login(email, password);
    } else {
      if (password !== confirmPassword) {
        setError('Mật khẩu nhập lại không khớp!');
        setLoading(false);
        return;
      }
      res = await register(email, password, name, day, month, year, hour, minute, gender);
    }

    setLoading(false);
    if (res.success) {
      onClose();
      if (onLoginSuccess) onLoginSuccess(res.user);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-xl">
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 z-50"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 text-amber-950">
          {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên của bạn</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useBazi} 
                    onChange={(e) => setUseBazi(e.target.checked)} 
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  Tôi muốn sử dụng tính năng Bát Tự (Cần nhập ngày sinh)
                </label>
              </div>

              {useBazi && (
                <div className="space-y-4 border-l-2 border-amber-200 pl-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày/Tháng/Năm Sinh (Dương lịch)</label>
                    <div className="flex gap-2">
                        <input type="number" min="1" max="31" placeholder="Ngày" required={useBazi} value={day} onChange={(e) => setDay(e.target.value)} className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                        <input type="number" min="1" max="12" placeholder="Tháng" required={useBazi} value={month} onChange={(e) => setMonth(e.target.value)} className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                        <input type="number" min="1900" max="2100" placeholder="Năm" required={useBazi} value={year} onChange={(e) => setYear(e.target.value)} className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giờ sinh (0-23) : Phút (0-59)</label>
                    <div className="flex gap-2">
                        <input type="number" min="0" max="23" placeholder="Giờ" required={useBazi} value={hour} onChange={(e) => setHour(e.target.value)} className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                        <input type="number" min="0" max="59" placeholder="Phút" required={useBazi} value={minute} onChange={(e) => setMinute(e.target.value)} className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                    <select value={gender} onChange={(e) => setGender(parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                        <option value={1}>Nam</option>
                        <option value={0}>Nữ</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="••••••••"
            />
          </div>
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="••••••••"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-amber-700 font-bold hover:underline"
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}

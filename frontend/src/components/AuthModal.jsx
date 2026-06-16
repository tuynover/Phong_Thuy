import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X, AlertTriangle, Check } from 'lucide-react';
import { submitBanAppeal } from '../services/api';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
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

  // Appeal States
  const [appealMode, setAppealMode] = useState(false);
  const [appealUserId, setAppealUserId] = useState('');
  const [appealEmail, setAppealEmail] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [appealMessage, setAppealMessage] = useState('');
  const [appealSuccess, setAppealSuccess] = useState('');
  const [hasPendingAppeal, setHasPendingAppeal] = useState(false);
  const googleButtonRef = useRef(null);

  const handleGoogleLoginCallback = async (response) => {
    setError('');
    setAppealUserId('');
    setAppealMode(false);
    setAppealSuccess('');
    setHasPendingAppeal(false);
    setLoading(true);
    const res = await loginWithGoogle(response.credential);
    setLoading(false);
    if (res.success) {
      onClose();
      if (onLoginSuccess) onLoginSuccess(res.user);
    } else {
      if (res.error === 'suspended' || res.error === 'deleted') {
        setError(`${res.message} Lý do: ${res.data?.reason || 'Vi phạm chính sách.'}`);
        setAppealUserId(res.data?.userId || 'google-user');
        setAppealEmail(res.data?.email || '');
        setAppealReason(res.data?.reason || 'Tài khoản bị tạm ngưng/xóa');
        setHasPendingAppeal(res.data?.hasPendingAppeal || false);
      } else {
        setError(res.message);
      }
    }
  };

  // Effect 1: Reset state only when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setAppealMode(false);
      setAppealUserId('');
      setAppealSuccess('');
      setAppealMessage('');
      setHasPendingAppeal(false);
    }
  }, [isOpen]);

  // Effect 2: Initialize Google Login button when modal is open and isLogin or appealMode changes
  useEffect(() => {
    if (!isOpen || appealMode) return;

    const timer = setTimeout(() => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleLoginCallback
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "signin_with"
        });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, isLogin, appealMode, appealSuccess, appealUserId]);

  const { login, register, loginWithGoogle } = useContext(AuthContext);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAppealSuccess('');
    setAppealUserId('');
    setAppealMode(false);
    setHasPendingAppeal(false);
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
      if (res.error === 'suspended' || res.error === 'deleted') {
        setError(`${res.message} Lý do: ${res.data?.reason || 'Vi phạm chính sách.'}`);
        setAppealUserId(res.data?.userId || 'locked-id');
        setAppealEmail(res.data?.email || email);
        setAppealReason(res.data?.reason || 'Khóa/xóa tài khoản');
        setHasPendingAppeal(res.data?.hasPendingAppeal || false);
      } else {
        setError(res.message);
      }
    }
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealMessage.trim()) return;

    setLoading(true);
    setError('');
    setAppealSuccess('');

    try {
      await submitBanAppeal(appealUserId, appealEmail, appealReason, appealMessage);
      setAppealSuccess('Đơn khiếu nại của bạn đã được gửi tới Ban Quản Trị thành công.');
      setHasPendingAppeal(true);
      setAppealMessage('');
      setAppealMode(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể gửi khiếu nại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-xl font-sans">
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 z-50"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 text-amber-950 font-serif">
          {appealMode ? 'Khiếu Nại Đình Chỉ' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl mb-4 text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {appealSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl mb-4 text-sm text-center font-semibold">
            {appealSuccess}
          </div>
        )}

            {appealMode ? (
              /* BAN APPEAL FORM */
              <form onSubmit={handleAppealSubmit} className="space-y-4">
                <p className="text-xs text-gray-500 mb-3">
                  Tài khoản của bạn: <strong>{appealEmail}</strong> đang bị tạm ngưng vì lý do: <em>"{appealReason}"</em>.
                  Hãy điền nội dung khiếu nại cụ thể để gửi lên Ban Quản Trị:
                </p>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nội dung khiếu nại</label>
                  <textarea
                    required
                    rows={4}
                    value={appealMessage}
                    onChange={(e) => setAppealMessage(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm focus:outline-none transition-all"
                    placeholder="Nhập lý do hoặc thông tin phản bác tại đây..."
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? 'Đang gửi...' : 'Gửi Khiếu Nại'}
                </button>
                <button
                  type="button"
                  onClick={() => setAppealMode(false)}
                  className="w-full text-center text-sm font-semibold text-gray-500 hover:underline pt-2"
                >
                  Quay lại Đăng Nhập
                </button>
              </form>
            ) : (
          /* STANDARD LOGIN / REGISTER FORM */
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useBazi} 
                      onChange={(e) => setUseBazi(e.target.checked)} 
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 focus:outline-none"
                    />
                    Tôi muốn sử dụng tính năng Bát Tự (Cần nhập ngày sinh)
                  </label>
                </div>

                {useBazi && (
                  <div className="space-y-4 border-l-2 border-amber-200 pl-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày/Tháng/Năm Sinh (Dương lịch)</label>
                      <div className="flex gap-2">
                          <input type="number" min="1" max="31" placeholder="Ngày" required={useBazi} value={day} onChange={(e) => setDay(e.target.value)} className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                          <input type="number" min="1" max="12" placeholder="Tháng" required={useBazi} value={month} onChange={(e) => setMonth(e.target.value)} className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                          <input type="number" min="1900" max="2100" placeholder="Năm" required={useBazi} value={year} onChange={(e) => setYear(e.target.value)} className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giờ sinh (0-23) : Phút (0-59)</label>
                      <div className="flex gap-2">
                          <input type="number" min="0" max="23" placeholder="Giờ" required={useBazi} value={hour} onChange={(e) => setHour(e.target.value)} className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                          <input type="number" min="0" max="59" placeholder="Phút" required={useBazi} value={minute} onChange={(e) => setMinute(e.target.value)} className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                      <select value={gender} onChange={(e) => setGender(parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            )}

            {appealUserId && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                {hasPendingAppeal ? (
                  <span className="text-gray-500 font-medium text-xs">
                    ⏳ Yêu cầu khiếu nại của bạn đang chờ phê duyệt.
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAppealMode(true)}
                    className="text-red-700 hover:text-red-800 font-extrabold text-sm hover:underline"
                  >
                    ⚠ Click vào đây để gửi đơn khiếu nại tài khoản
                  </button>
                )}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 focus:outline-none"
            >
              {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
            </button>
          </form>
        )}

        {!appealMode && (
          <>
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <span className="relative bg-white px-3 text-xs text-gray-400 uppercase">Hoặc</span>
            </div>

            <div className="flex justify-center w-full mb-2">
              <div ref={googleButtonRef} className="w-full flex justify-center"></div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-amber-700 font-bold hover:underline focus:outline-none"
              >
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
